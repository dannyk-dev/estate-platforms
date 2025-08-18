'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { protocol, rootDomain } from '@/lib/utils'
import { isValidIcon } from '@/lib/subdomains'
import { assertAdmin } from '@/lib/auth/helpers'
import { createClient } from '@/lib/supabase/server'

const RESERVED = new Set(['www', 'admin', 'api', 'cdn', 'assets', 'static'])
const BUCKET = 'project-images'

type DeleteState = { error?: string; success?: string }

function sanitize(sub: string) {
  return sub.toLowerCase().replace(/[^a-z0-9-]/g, '')
}
function validSlug(sub: string) {
  if (sub.length < 1 || sub.length > 63) return false
  if (!/^[a-z0-9-]+$/.test(sub)) return false
  if (sub.startsWith('-') || sub.endsWith('-')) return false
  if (RESERVED.has(sub)) return false
  return true
}

export async function createSubdomainAction(_prevState: any, formData: FormData) {
  const raw = formData.get('subdomain') as string
  const icon = formData.get('icon') as string

  if (!raw || !icon) {
    return { success: false, error: 'Subdomain and icon are required' }
  }
  if (!isValidIcon(icon)) {
    return {
      subdomain: raw,
      icon,
      success: false,
      error: 'Please enter a valid emoji (maximum 10 characters)'
    }
  }

  const slug = sanitize(raw)
  if (slug !== raw || !validSlug(slug)) {
    return {
      subdomain: raw,
      icon,
      success: false,
      error:
        'Subdomain can only have lowercase letters, numbers, and hyphens. Please try again.'
    }
  }

  const { sb } = await assertAdmin()

  // Uniqueness checks
  {
    const [{ data: p, error: ep }, { data: d, error: ed }] = await Promise.all([
      sb.from('projects').select('id').eq('slug', slug).maybeSingle(),
      sb.from('project_domains').select('id').eq('hostname', `${slug}.${rootDomain}`).maybeSingle()
    ])
    if (ep) throw ep
    if (ed) throw ed
    if (p || d) {
      return { subdomain: slug, icon, success: false, error: 'This subdomain is already taken' }
    }
  }

  // Create project
  const { data: project, error: e1 } = await sb
    .from('projects')
    .insert({
      name: slug.replace(/-/g, ' '),
      slug,
      headline: null,
      description: null,
      hero_url: null,
      config: { emoji: icon },
      published: false
    })
    .select('id, slug')
    .single()
  if (e1) {
    // Unique violation guard
    if (String(e1.message).toLowerCase().includes('unique')) {
      return { subdomain: slug, icon, success: false, error: 'This subdomain is already taken' }
    }
    throw e1
  }

  // Attach primary domain
  const hostname = `${slug}.${rootDomain}`
  const { error: e2 } = await sb
    .from('project_domains')
    .insert({ project_id: project.id, hostname, is_primary: true })
  if (e2) {
    // rollback to avoid orphaned project
    await sb.from('projects').delete().eq('id', project.id)
    throw e2
  }

  redirect(`${protocol}://${hostname}`)
}

export async function deleteSubdomainAction(
  _prevState: DeleteState,
  formData: FormData
): Promise<DeleteState> {
  try {
    const raw = String(formData.get('subdomain') ?? '')
    const slug = sanitize(raw)
    if (!validSlug(slug)) return { error: 'Invalid subdomain' }

    const { sb } = await assertAdmin()

    // Find project
    const { data: proj, error: e0 } = await sb
      .from('projects')
      .select('id, slug')
      .eq('slug', slug)
      .maybeSingle()
    if (e0) throw e0
    if (!proj) return { error: 'Subdomain not found' }

    // Best-effort storage cleanup
    const prefix = proj.id
    let offset = 0
    const page = 1000
    while (true) {
      const { data: objs, error: lerr } = await sb.storage
        .from(BUCKET)
        .list(prefix, { limit: page, offset })
      if (lerr) break
      if (!objs?.length) break
      const keys = objs.map((o) => `${prefix}/${o.name}`)
      for (let i = 0; i < keys.length; i += 100) {
        const { error: rerr } = await sb.storage.from(BUCKET).remove(keys.slice(i, i + 100))
        if (rerr) return { error: rerr.message }
      }
      if (objs.length < page) break
      offset += page
    }

    // Delete project (FKs cascade)
    const { error: delErr } = await sb.from('projects').delete().eq('id', proj.id)
    if (delErr) return { error: delErr.message }

    revalidatePath('/admin')
    return { success: 'Domain deleted successfully' }
  } catch (err: any) {
    return { error: err?.message ?? 'UNKNOWN_ERROR' }
  }
}
