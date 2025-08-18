// lib/supabase/client.ts
'use client'

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/database.types'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createBrowserClient<Database>(url, anon, {
    db: { schema: 'app' },
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  })
}
