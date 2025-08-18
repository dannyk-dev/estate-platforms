// app/signup/page.tsx
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SignupForm } from './form'

const allow = process.env.ALLOW_SELF_SIGNUP === 'true'

export default async function Page() {
  if (!allow) notFound()
  const sb = await createClient()
  const { data } = await sb.auth.getUser()
  if (data.user) redirect('/admin')
  return <SignupForm />
}
