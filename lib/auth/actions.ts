'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

// Helper: check if current user is admin via user_roles
async function isCurrentUserAdmin() {
  const sb = await createClient()
  const { data: u, error: uErr } = await sb.auth.getUser()
  if (uErr) throw uErr
  if (!u.user) return false

  const { count, error } = await sb
    .from('user_roles')
    .select('role', { count: 'exact', head: true })
    .eq('user_id', u.user.id)
    .eq('role', 'admin')

  if (error) throw error
  return (count || 0) > 0
}

// Email/password only
export async function signInWithPassword(email: string, password: string) {
  // cookieWrite:true so Supabase can set auth cookies during the action
  const sb = await createClient({ cookieWrite: true })
  const { data, error } = await sb.auth.signInWithPassword({ email, password })
  if (error) throw error
  return { user: data.user }
}

export async function signUpWithPassword(email: string, password: string) {
  // cookieWrite:true so session cookies persist if signups create a session
  const sb = await createClient({ cookieWrite: true })
  const { data, error } = await sb.auth.signUp({ email, password })
  if (error) throw error

  // If the project requires email confirmations, data.user may exist
  // without a session. We still upsert the role row keyed by user_id.
  const userId = data.user?.id ?? data.session?.user?.id
  if (userId) {
    const { error: roleErr } = await sb
      .from('user_roles')
      .upsert([{ user_id: userId, role: 'admin' }], { onConflict: 'user_id' })
    if (roleErr) throw roleErr
  }

  return { user: data.user }
}

export type AuthState = { error?: string }

export async function loginAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  try {
    const email = String(formData.get('email') || '').trim()
    const password = String(formData.get('password') || '')
    if (!email || !password) return { error: 'Email and password are required' }

    await signInWithPassword(email, password)

    // Enforce admin-only access by querying user_roles
    const isAdmin = await isCurrentUserAdmin()
    if (!isAdmin) {
      await signOut()
      return { error: 'Not authorized' }
    }

    redirect('/admin')
  } catch (e: any) {
    return { error: e?.message ?? 'LOGIN_FAILED' }
  }
}

export async function signupAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  try {
    const email = String(formData.get('email') || '').trim()
    const password = String(formData.get('password') || '')
    if (!email || !password) return { error: 'Email and password are required' }

    await signUpWithPassword(email, password)

    // After signup, the new user is upserted as admin. Verify and route.
    const isAdmin = await isCurrentUserAdmin()
    if (!isAdmin) {
      await signOut()
      return { error: 'Not authorized' }
    }

    redirect('/admin')
  } catch (e: any) {
    return { error: e?.message ?? 'SIGNUP_FAILED' }
  }
}

export async function logoutAction(): Promise<never> {
  await signOut()
  redirect('/login')
}

export async function signOut() {
  const sb = await createClient({ cookieWrite: true })
  const { error } = await sb.auth.signOut()
  if (error) throw error
  return { ok: true }
}
