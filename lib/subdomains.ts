import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

export function isValidIcon(str: string) {
  if (str.length > 10) return false
  try {
    // Better coverage than \p{Emoji}
    const emojiPattern = /[\p{Extended_Pictographic}]/u
    if (emojiPattern.test(str)) return true
  } catch {}
  return str.length >= 1 && str.length <= 10
}

export type SubdomainData = {
  emoji: string
  createdAt: number
}

function sanitize(sub: string) {
  return sub.toLowerCase().replace(/[^a-z0-9-]/g, '')
}

// One subdomain → project by slug, published only
export async function getSubdomainData(subdomain: string, sb?: SupabaseClient) {
  const supabase = sb ?? await createClient()
  const slug = sanitize(subdomain)

  const { data, error } = await supabase
    .from('projects')
    .select('config, created_at, published')
    .eq('slug', slug)
    .maybeSingle()

  if (error) throw error
  if (!data || data.published !== true) return null

  const emoji = (data.config?.emoji as string) || '❓'
  const ts = Date.parse(data.created_at as unknown as string)
  if (Number.isNaN(ts)) throw new Error('invalid created_at')

  const res: SubdomainData = { emoji, createdAt: ts }
  return res
}

// All published subdomains (by slug)
export async function getAllSubdomains(sb?: SupabaseClient) {
  const supabase = sb ?? await createClient()

  const { data, error } = await supabase
    .from('projects')
    .select('slug, config, created_at')
    .eq('published', true)
    .order('created_at', { ascending: false })

  if (error) throw error
  if (!data) return []

  return data.map((row) => {
    const ts = Date.parse(row.created_at as unknown as string)
    if (Number.isNaN(ts)) throw new Error('invalid created_at')
    return {
      subdomain: row.slug as string,
      emoji: (row.config?.emoji as string) || '❓',
      createdAt: ts,
    }
  })
}
