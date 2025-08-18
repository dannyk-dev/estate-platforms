// app/actions/images.ts
'use server'

import { revalidatePath } from 'next/cache'
import { assertAdmin } from '@/lib/auth/helpers'
import { createClient } from '@/lib/supabase/server'
import { randomUUID } from 'node:crypto'

export type SimpleState = { error?: string; success?: string }

const BUCKET = 'project-images'

export async function uploadImagesAction(projectId: string, form: FormData): Promise<SimpleState> {
  try {
    const { sb } = await assertAdmin()
    const pid = String(projectId)
    const files = form.getAll('images').filter((f): f is File => f instanceof File && f.size > 0)
    if (files.length === 0) return { error: 'NO_FILES' }

    // Find current max position
    const { data: rows, error: e0 } = await sb.from('project_images').select('position').eq('project_id', pid).order('position', { ascending: false }).limit(1)
    if (e0) throw e0
    let pos = rows?.[0]?.position ?? -1

    for (const file of files) {
      const ext = (file.name.split('.').pop() || 'bin').toLowerCase()
      const key = `${pid}/${randomUUID()}.${ext}`
      const { error: upErr } = await sb.storage.from(BUCKET).upload(key, file, { upsert: false })
      if (upErr) return { error: upErr.message }

      pos += 1
      const { error: insErr } = await sb.from('project_images').insert({
        project_id: pid,
        storage_path: key,
        position: pos,
      })
      if (insErr) return { error: insErr.message }
    }

    revalidatePath(`/admin/projects/${pid}`)
    return { success: 'UPLOADED' }
  } catch (err: any) {
    return { error: err?.message || 'UNKNOWN_ERROR' }
  }
}

export async function deleteImageAction(form: FormData): Promise<SimpleState> {
  try {
    const { sb } = await assertAdmin()
    const imageId = String(form.get('imageId') || '')
    if (!imageId) return { error: 'MISSING_IMAGE_ID' }
    const { data: rows, error: e0 } = await sb.from('project_images').select('id, project_id, storage_path').eq('id', imageId).single()
    if (e0) return { error: e0.message }
    const { error: rmErr } = await sb.storage.from(BUCKET).remove([rows.storage_path])
    if (rmErr) return { error: rmErr.message }
    const { error } = await sb.from('project_images').delete().eq('id', imageId)
    if (error) return { error: error.message }
    revalidatePath(`/admin/projects/${rows.project_id}`)
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
    const { data: img, error: e0 } = await sb.from('project_images').select('id, project_id').eq('id', imageId).single()
    if (e0) return { error: e0.message }
    const pid = img.project_id
    // reset others
    await sb.from('project_images').update({ is_primary: false }).eq('project_id', pid)
    const { error } = await sb.from('project_images').update({ is_primary: true }).eq('id', imageId)
    if (error) return { error: error.message }
    revalidatePath(`/admin/projects/${pid}`)
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
    const { data: img, error: e0 } = await sb.from('project_images').select('id, project_id').eq('id', imageId).single()
    if (e0) return { error: e0.message }
    const { error } = await sb.from('project_images').update({ pinned_rank: rank }).eq('id', imageId)
    if (error) return { error: error.message }
    revalidatePath(`/admin/projects/${img.project_id}`)
    return { success: 'UPDATED' }
  } catch (err: any) {
    return { error: err?.message || 'UNKNOWN_ERROR' }
  }
}

export async function addTagsAction(prev: SimpleState, form: FormData): Promise<SimpleState> {
  try {
    const { sb } = await assertAdmin()
    const imageId = String(form.get('imageId') || '')
    const tagsRaw = String(form.get('tags') || '')
    if (!imageId || !tagsRaw) return { error: 'MISSING_FIELDS' }
    const { data: img, error: e0 } = await sb.from('project_images').select('id, project_id').eq('id', imageId).single()
    if (e0) return { error: e0.message }
    const tags = Array.from(new Set(tagsRaw.split(',').map(s => s.trim()).filter(Boolean))).slice(0, 20)
    if (tags.length === 0) return { error: 'NO_TAGS' }
    const rows = tags.map(tag => ({ project_id: img.project_id, image_id: imageId, tag }))
    const { error } = await sb.from('project_image_tags').upsert(rows, { onConflict: 'project_id,image_id,tag' as any })
    if (error) return { error: error.message }
    revalidatePath(`/admin/projects/${img.project_id}`)
    return { success: 'ADDED' }
  } catch (err: any) {
    return { error: err?.message || 'UNKNOWN_ERROR' }
  }
}

export async function removeTagAction(prev: SimpleState, form: FormData): Promise<SimpleState> {
  try {
    const { sb } = await assertAdmin()
    const imageId = String(form.get('imageId') || '')
    const tag = String(form.get('tag') || '')
    if (!imageId || !tag) return { error: 'MISSING_FIELDS' }
    const { data: img, error: e0 } = await sb.from('project_images').select('id, project_id').eq('id', imageId).single()
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
    const pid = String(projectId)
    const ordered = JSON.parse(String(form.get('ordered') || '[]')) as Array<{ id: string; position: number }>
    if (!Array.isArray(ordered) || ordered.length === 0) return { error: 'NO_ORDER' }
    // Verify the images belong to the project
    const ids = ordered.map(o => o.id)
    const { data: rows, error: e0 } = await sb.from('project_images').select('id, project_id').in('id', ids)
    if (e0) return { error: e0.message }
    if (rows.some(r => r.project_id !== pid)) return { error: 'IMAGE_PROJECT_MISMATCH' }
    for (const o of ordered) {
      await sb.from('project_images').update({ position: o.position }).eq('id', o.id)
    }
    revalidatePath(`/admin/projects/${pid}`)
    return { success: 'REORDERED' }
  } catch (err: any) {
    return { error: err?.message || 'UNKNOWN_ERROR' }
  }
}
