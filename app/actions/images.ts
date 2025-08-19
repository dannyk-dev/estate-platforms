// app/actions/images.ts
'use server'

import { revalidatePath } from 'next/cache'
import { assertAdmin } from '@/lib/auth/helpers'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import type { Database } from '@/database.types'
import { randomUUID } from 'node:crypto'

export type SimpleState = { error?: string; success?: string }

const BUCKET = 'project-images'

// Server-only admin client for Storage (bypasses owner_id/sub issues)
const admin = createAdminClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

function extFromNameOrType(file: File): string {
  const nameExt = (file.name.split('.').pop() || '').toLowerCase()
  if (nameExt) return nameExt
  const t = file.type || ''
  if (t.startsWith('image/')) return t.split('/')[1] || 'bin'
  return 'bin'
}

function pickFiles(input: unknown, names = ['images', 'file', 'files']): File[] {
  const f: File[] = []
  const anyForm = input as any
  if (anyForm && typeof anyForm.getAll === 'function') {
    for (const n of names) for (const v of anyForm.getAll(n)) if (v instanceof File && v.size > 0) f.push(v)
    for (const n of names) for (const v of anyForm.getAll(n + '[]')) if (v instanceof File && v.size > 0) f.push(v)
    return f
  }
  // tolerate accidental direct calls passing plain objects
  const candidates = [anyForm?.images, anyForm?.file, anyForm?.files, anyForm?.['images[]'], anyForm?.['files[]']]
  for (const c of candidates) {
    if (!c) continue
    if (c instanceof File && c.size > 0) f.push(c)
    else if (Array.isArray(c)) for (const v of c) if (v instanceof File && v.size > 0) f.push(v)
  }
  return f
}


export async function uploadImagesAction(projectId: string, form: FormData): Promise<SimpleState> {
  try {
    const { sb } = await assertAdmin()
    const pid = String(projectId || '').trim()
    if (!pid) return { error: 'MISSING_PROJECT_ID' }

    // Ensure session is valid for DB writes
    const { data: u, error: uErr } = await sb.auth.getUser()
    if (uErr) return { error: uErr.message }
    if (!u.user) return { error: 'AUTH_REQUIRED' }

    const files = pickFiles(form)
    if (files.length === 0) return { error: 'NO_FILES' }

    // Current max position
    const { data: rows, error: e0 } = await sb
      .from('project_images')
      .select('position')
      .eq('project_id', pid)
      .order('position', { ascending: false })
      .limit(1)
    if (e0) return { error: e0.message }
    let pos = rows?.[0]?.position ?? -1

    for (const file of files) {
      const key = `${pid}/${randomUUID()}.${extFromNameOrType(file)}`
      const { error: upErr } = await admin
        .storage
        .from(BUCKET)
        .upload(key, file, { upsert: false, contentType: file.type || undefined, cacheControl: '3600' })
      if (upErr) return { error: `STORAGE:${upErr.message}` }

      pos += 1
      const { error: insErr } = await sb.from('project_images').insert({
        project_id: pid,
        storage_path: key,
        position: pos,
      })
      if (insErr) return { error: insErr.message }
    }

    revalidatePath(`/admin/projects/${pid}`)
    return { success: `UPLOADED:${files.length}` }
  } catch (err: any) {
    return { error: err?.message || 'UNKNOWN_ERROR' }
  }
}

export async function deleteImageAction(form: FormData): Promise<SimpleState> {
  try {
    const { sb } = await assertAdmin()
    const imageId = String(form.get('imageId') || '')
    if (!imageId) return { error: 'MISSING_IMAGE_ID' }

    const { data: row, error: e0 } = await sb
      .from('project_images')
      .select('id, project_id, storage_path')
      .eq('id', imageId)
      .single()
    if (e0) return { error: e0.message }

    const { error: rmErr } = await admin.storage.from(BUCKET).remove([row.storage_path])
    if (rmErr) return { error: `STORAGE:${rmErr.message}` }

    const { error } = await sb.from('project_images').delete().eq('id', imageId)
    if (error) return { error: error.message }

    revalidatePath(`/admin/projects/${row.project_id}`)
    return { success: 'DELETED' }
  } catch (err: any) {
    return { error: err?.message || 'UNKNOWN_ERROR' }
  }
}

export async function setPrimaryAction(form: FormData): Promise<SimpleState> {
  try {
    const { sb } = await assertAdmin()
    const imageId = String(form.get('imageId') || '')
    if (!imageId) return { error: 'MISSING_IMAGE_ID' }

    const { data: img, error: e0 } = await sb
      .from('project_images')
      .select('id, project_id')
      .eq('id', imageId)
      .single()
    if (e0) return { error: e0.message }

    await sb.from('project_images').update({ is_primary: false }).eq('project_id', img.project_id)
    const { error } = await sb.from('project_images').update({ is_primary: true }).eq('id', imageId)
    if (error) return { error: error.message }

    revalidatePath(`/admin/projects/${img.project_id}`)
    return { success: 'UPDATED' }
  } catch (err: any) {
    return { error: err?.message || 'UNKNOWN_ERROR' }
  }
}

export async function setPinnedRankAction(form: FormData): Promise<SimpleState> {
  try {
    const { sb } = await assertAdmin()
    const imageId = String(form.get('imageId') || '')
    const rankStr = String(form.get('rank') || '')
    const rank = rankStr ? Number(rankStr) : null
    if (!imageId) return { error: 'MISSING_IMAGE_ID' }

    const { data: img, error: e0 } = await sb
      .from('project_images')
      .select('id, project_id')
      .eq('id', imageId)
      .single()
    if (e0) return { error: e0.message }

    const { error } = await sb.from('project_images').update({ pinned_rank: rank }).eq('id', imageId)
    if (error) return { error: error.message }

    revalidatePath(`/admin/projects/${img.project_id}`)
    return { success: 'UPDATED' }
  } catch (err: any) {
    return { error: err?.message || 'UNKNOWN_ERROR' }
  }
}

export async function addTagsAction(_prev: SimpleState, form: FormData): Promise<SimpleState> {
  try {
    const { sb } = await assertAdmin()
    const imageId = String(form.get('imageId') || '')
    const tagsRaw = String(form.get('tags') || '')
    if (!imageId || !tagsRaw) return { error: 'MISSING_FIELDS' }

    const { data: img, error: e0 } = await sb
      .from('project_images')
      .select('id, project_id')
      .eq('id', imageId)
      .single()
    if (e0) return { error: e0.message }

    const tags = Array.from(new Set(tagsRaw.split(',').map((s) => s.trim()).filter(Boolean))).slice(0, 20)
    if (tags.length === 0) return { error: 'NO_TAGS' }

    const rows = tags.map((tag) => ({ project_id: img.project_id, image_id: imageId, tag }))
    const { error } = await sb
      .from('project_image_tags')
      // @ts-expect-error string onConflict accepted by PostgREST
      .upsert(rows, { onConflict: 'project_id,image_id,tag' })
    if (error) return { error: error.message }

    revalidatePath(`/admin/projects/${img.project_id}`)
    return { success: 'ADDED' }
  } catch (err: any) {
    return { error: err?.message || 'UNKNOWN_ERROR' }
  }
}

export async function removeTagAction(_prev: SimpleState, form: FormData): Promise<SimpleState> {
  try {
    const { sb } = await assertAdmin()
    const imageId = String(form.get('imageId') || '')
    const tag = String(form.get('tag') || '')
    if (!imageId || !tag) return { error: 'MISSING_FIELDS' }

    const { data: img, error: e0 } = await sb
      .from('project_images')
      .select('id, project_id')
      .eq('id', imageId)
      .single()
    if (e0) return { error: e0.message }

    const { error } = await sb.from('project_image_tags').delete().eq('image_id', imageId).eq('tag', tag)
    if (error) return { error: error.message }

    revalidatePath(`/admin/projects/${img.project_id}`)
    return { success: 'REMOVED' }
  } catch (err: any) {
    return { error: err?.message || 'UNKNOWN_ERROR' }
  }
}

export async function reorderImagesAction(projectId: string, form: FormData): Promise<SimpleState> {
  try {
    const { sb } = await assertAdmin()
    const pid = String(projectId || '').trim()
    if (!pid) return { error: 'MISSING_PROJECT_ID' }

    const ordered = JSON.parse(String(form.get('ordered') || '[]')) as Array<{ id: string; position: number }>
    if (!Array.isArray(ordered) || ordered.length === 0) return { error: 'NO_ORDER' }

    const ids = ordered.map((o) => o.id)
    const { data: rows, error: e0 } = await sb.from('project_images').select('id, project_id').in('id', ids)
    if (e0) return { error: e0.message }
    if ((rows || []).some((r) => r.project_id !== pid)) return { error: 'IMAGE_PROJECT_MISMATCH' }

    for (const o of ordered) {
      const { error } = await sb.from('project_images').update({ position: o.position }).eq('id', o.id)
      if (error) return { error: error.message }
    }

    revalidatePath(`/admin/projects/${pid}`)
    return { success: 'REORDERED' }
  } catch (err: any) {
    return { error: err?.message || 'UNKNOWN_ERROR' }
  }
}
