// lib/auth/helpers.ts
'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean)

export async function getSessionUser() {
  const sb = await createClient()
  const { data: { user }, error } = await sb.auth.getUser()
  // if (error) throw error
  return user
}

export async function assertSignedIn() {
  const user = await getSessionUser()
  if (!user) redirect('/login')
  return { user }
}

export async function assertAdmin() {
  const { user } = await assertSignedIn()
  if (ADMIN_EMAILS.length && !ADMIN_EMAILS.includes((user.email || '').toLowerCase())) {
    throw new Error('NOT_AUTHORIZED')
  }
  // Optionally return a supabase client for convenience
  const sb = await createClient()
  return { user, sb }
}
