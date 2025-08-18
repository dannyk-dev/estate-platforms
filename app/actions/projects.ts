// app/actions/projects.ts
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { assertAdmin } from '@/lib/auth/helpers'
import { createClient } from '@/lib/supabase/server'
import { rootDomain } from '@/lib/utils'

export type SaveState = { error?: string; success?: string; createdId?: string }

function sanitizeSlug(v: string) {
  return v.toLowerCase().replace(/[^a-z0-9-]/g, '')
}
function validSlug(v: string) {
  if (v.length < 1 || v.length > 63) return false
  if (!/^[a-z0-9-]+$/.test(v)) return false
  if (v.startsWith('-') || v.endsWith('-')) return false
  return true
}

export async function saveProjectAction(prev: SaveState, form: FormData): Promise<SaveState> {
  try {
    const { sb } = await assertAdmin()
    const id = (form.get('id') as string | null) || null
    const name = String(form.get('name') || '').trim()
    const slugRaw = String(form.get('slug') || '').trim()
    const headline = String(form.get('headline') || '')
    const description = String(form.get('description') || '')
    const heroUrl = String(form.get('heroUrl') || '')
    const published = form.get('published') === 'on' || form.get('published') === 'true'

    if (!name) return { error: 'NAME_REQUIRED' }
    const slug = sanitizeSlug(slugRaw)
    if (!validSlug(slug)) return { error: 'INVALID_SLUG' }

    if (id) {
      const { error } = await sb.from('projects').update({
        name, slug, headline, description, hero_url: heroUrl, published
      }).eq('id', id)
      if (error) return { error: error.message }
      revalidatePath('/admin')
      revalidatePath(`/admin/projects/${id}`)
      return { success: 'UPDATED' }
    } else {
      // Create project
      const { data: created, error } = await sb.from('projects').insert({
        name, slug, headline, description, hero_url: heroUrl, published
      }).select('id, slug').single()
      if (error) return { error: error.message }
      const projId = created.id as string

      // Ensure a primary domain record exists for this slug on rootDomain
      const hostname = `${created.slug}.${rootDomain}`
      const { error: dErr } = await sb.from('project_domains').insert({
        project_id: projId,
        hostname,
        is_primary: true,
      })
      if (dErr) return { error: dErr.message }

      revalidatePath('/admin')
      redirect(`/admin/projects/${projId}`)
    }
  } catch (err: any) {
    return { error: err?.message || 'UNKNOWN_ERROR' }
  }
}

export type SimpleState = { error?: string; success?: string }

export async function publishProjectAction(prev: SimpleState, form: FormData): Promise<SimpleState> {
  try {
    const { sb } = await assertAdmin()
    const id = String(form.get('id') || '')
    const pub = form.get('published') === 'on' || form.get('published') === 'true'
    const { error } = await sb.from('projects').update({ published: pub }).eq('id', id)
    if (error) return { error: error.message }
    revalidatePath('/admin'); revalidatePath(`/admin/projects/${id}`)
    return { success: 'UPDATED' }
  } catch (err: any) {
    return { error: err?.message || 'UNKNOWN_ERROR' }
  }
}

export async function deleteProjectAction(prev: SimpleState, form: FormData): Promise<SimpleState> {
  try {
    const { sb } = await assertAdmin()
    const id = String(form.get('id') || '')
    if (!id) return { error: 'MISSING_ID' }
    // Delete storage objects under both buckets for this project
    const buckets = ['project-images','project-assets'] as const
    for (const b of buckets) {
      let offset = 0
      const page = 100
      while (true) {
        const { data: list, error } = await sb.storage.from(b).list(id, { limit: page, offset })
        if (error) break
        const objs = list?.map(o => `${id}/${o.name}`) || []
        if (objs.length) await sb.storage.from(b).remove(objs)
        if (objs.length < page) break
        offset += page
      }
    }
    const { error } = await sb.from('projects').delete().eq('id', id)
    if (error) return { error: error.message }
    revalidatePath('/admin')
    return { success: 'DELETED' }
  } catch (err: any) {
    return { error: err?.message || 'UNKNOWN_ERROR' }
  }
}
