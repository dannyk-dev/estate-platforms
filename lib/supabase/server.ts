// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/database.types'

function decode(v?: string) {
  if (!v) return undefined
  if (v.startsWith('base64-')) {
    const b = v.slice(7)
    // @ts-expect-error atob may exist on edge
    return typeof atob === 'function' ? atob(b) : Buffer.from(b, 'base64').toString('utf-8')
  }
  return v
}

export async function createClient(opts?: { cookieWrite?: boolean }) {
  const store = await cookies()
  const write = !!opts?.cookieWrite

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      db: { schema: 'app' },
      cookies: {
        getAll() {
          return store.getAll().map(({ name, value }) => ({ name, value: decode(value) ?? '' }))
        },
        setAll(list) {
          if (!write) return // no-op outside Server Actions / Route Handlers
          for (const { name, value, options } of list) {
            store.set({ name, value, ...options })
          }
        },
      },
    }
  )
}
