// app/actions/assets.ts
'use server'

import crypto from 'node:crypto'
import { revalidatePath } from 'next/cache'
import { assertAdmin } from '@/lib/auth/helpers'
import { uuid } from '@/lib/validators'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import type { Database } from '@/database.types'

const BUCKET = 'project-assets'
const ALLOWED_EMBED_HOSTS = [
  'youtube.com',
  'www.youtube.com',
  'youtu.be',
  'vimeo.com',
  'player.vimeo.com',
  'matterport.com',
  'my.matterport.com',
]

export type SimpleState = { error?: string; success?: string }
type Kind = 'video' | 'pdf' | 'floorplan' | 'tour'

// server-only Storage client (bypasses RLS/owner_id issues)
const storageAdmin = createAdminClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

// ---------- helpers ----------

function isAllowedEmbed(u: string) {
  try {
    const url = new URL(u)
    if (url.protocol !== 'https:') return false
    const host = url.hostname.toLowerCase()
    return ALLOWED_EMBED_HOSTS.some((h) => host === h || host.endsWith('.' + h))
  } catch {
    return false
  }
}

function fileExt(file: File): string {
  const byName = (file.name.split('.').pop() || '').toLowerCase()
  if (byName) return byName
  const t = (file.type || '').toLowerCase()
  if (!t) return 'bin'
  if (t === 'application/pdf') return 'pdf'
  const [, ext] = t.split('/')
  return (ext || 'bin').toLowerCase()
}

function pickFiles(formData: FormData): File[] {
  const pools = [
    ...formData.getAll('files'),
    ...formData.getAll('file'),
    ...formData.getAll('images'),
    ...formData.getAll('files[]'),
    ...formData.getAll('images[]'),
  ]
  return pools.filter((v): v is File => v instanceof File && v.size > 0)
}

function revalidateProject(pid: string) {
  revalidatePath('/admin')
  revalidatePath(`/admin/projects/${pid}`)
}

// ---------- core functions ----------

// Upload a file asset (pdf | floorplan | video)
export async function createFileAsset(
  projectId: string,
  kind: Extract<Kind, 'pdf' | 'floorplan' | 'video'>,
  file: File,
  meta?: { title?: string; description?: string; position?: number }
) {
  const { sb } = await assertAdmin()
  const pid = uuid.parse(projectId)
  const pidStr = String(pid)

  if (!(file instanceof File)) throw new Error('FILE_REQUIRED')
  const contentType = file.type || 'application/octet-stream'

  if (kind === 'pdf' && contentType !== 'application/pdf') throw new Error('PDF_ONLY')
  if (kind === 'floorplan' && !/^image\//i.test(contentType)) throw new Error('IMAGE_ONLY')
  if (kind === 'video' && !/^video\//i.test(contentType)) throw new Error('VIDEO_ONLY')

  const key = `${pidStr}/${crypto.randomUUID()}.${fileExt(file)}`
  const up = await storageAdmin.storage.from(BUCKET).upload(key, file, {
    contentType,
    cacheControl: '31536000',
    upsert: false,
  })
  if (up.error) throw up.error

  const { error } = await sb.from('project_assets').insert({
    project_id: pid,
    kind,
    title: meta?.title ?? null,
    description: meta?.description ?? null,
    storage_path: key,
    external_url: null,
    position: Math.max(0, Math.floor(meta?.position ?? 0)),
  })
  if (error) throw error

  revalidateProject(pidStr)
  return { ok: true, storagePath: key }
}

// Create a URL asset (video | tour)
export async function createUrlAsset(
  projectId: string,
  kind: Extract<Kind, 'video' | 'tour'>,
  externalUrl: string,
  meta?: { title?: string; description?: string; position?: number }
) {
  const { sb } = await assertAdmin()
  const pid = uuid.parse(projectId)
  const pidStr = String(pid)

  const url = String(externalUrl || '').trim()
  if (!isAllowedEmbed(url)) throw new Error('EMBED_HOST_NOT_ALLOWED')

  const { error } = await sb.from('project_assets').insert({
    project_id: pid,
    kind,
    title: meta?.title ?? null,
    description: meta?.description ?? null,
    external_url: url,
    storage_path: null,
    position: Math.max(0, Math.floor(meta?.position ?? 0)),
  })
  if (error) throw error

  revalidateProject(pidStr)
  return { ok: true }
}

export async function deleteAsset(assetId: string) {
  const { sb } = await assertAdmin()
  const id = uuid.parse(assetId)

  const { data: a, error: e0 } = await sb
    .from('project_assets')
    .select('project_id, storage_path')
    .eq('id', id)
    .single()
  if (e0) throw e0

  if (a.storage_path) {
    const del = await storageAdmin.storage.from(BUCKET).remove([a.storage_path])
    if (del.error) throw del.error
  }

  const { error } = await sb.from('project_assets').delete().eq('id', id)
  if (error) throw error

  revalidateProject(String(a.project_id))
  return { ok: true }
}

export async function reorderAssets(
  projectId: string,
  ordered: Array<{ id: string; position: number }>
) {
  const { sb } = await assertAdmin()
  const pid = uuid.parse(projectId)
  const pidStr = String(pid)

  const ids = ordered.map((o) => o.id)
  const { data: rows, error: e0 } = await sb
    .from('project_assets')
    .select('id, project_id')
    .in('id', ids)
  if (e0) throw e0
  if ((rows || []).some((r) => r.project_id !== pid)) throw new Error('ASSET_PROJECT_MISMATCH')

  for (const o of ordered) {
    const { error } = await sb
      .from('project_assets')
      .update({ position: Math.max(0, Math.floor(o.position)) })
      .eq('id', o.id)
    if (error) throw error
  }

  revalidateProject(pidStr)
  return { ok: true }
}

// ---------- server actions (form-friendly) ----------

export async function createUrlAssetAction(
  projectId: string,
  _prev: SimpleState,
  formData: FormData
): Promise<SimpleState> {
  try {
    const kind = String(formData.get('kind') || 'video') as 'video' | 'tour'
    const url = String(formData.get('url') || '')
    const title = String(formData.get('title') || '')
    const description = String(formData.get('description') || '')
    await createUrlAsset(projectId, kind, url, {
      title: title || undefined,
      description: description || undefined,
    })
    return { success: 'ADDED' }
  } catch (e: any) {
    return { error: e?.message ?? 'ERR' }
  }
}

export async function uploadAssetFilesAction(
  projectId: string,
  kind: 'pdf' | 'floorplan' | 'video',
  _prev: SimpleState,
  formData: FormData
): Promise<SimpleState> {
  try {
    const files = pickFiles(formData)
    if (files.length === 0) return { error: 'NO_FILES' }

    // validate by kind
    const accept = (f: File) => {
      const t = (f.type || '').toLowerCase()
      const n = f.name.toLowerCase()
      if (kind === 'pdf') return t === 'application/pdf' || n.endsWith('.pdf')
      if (kind === 'floorplan') return t.startsWith('image/')
      if (kind === 'video') return t.startsWith('video/')
      return false
    }
    const accepted = files.filter(accept)
    if (accepted.length === 0) return { error: 'NO_ACCEPTED_FILES' }

    // sequential to keep position stable; change to Promise.all if order does not matter
    for (const f of accepted) await createFileAsset(projectId, kind, f, {})

    return { success: `UPLOADED:${accepted.length}` }
  } catch (e: any) {
    return { error: e?.message ?? 'ERR' }
  }
}

export async function deleteAssetAction(formData: FormData): Promise<SimpleState> {
  try {
    const id = String(formData.get('assetId') || '')
    if (!id) return { error: 'MISSING_ASSET_ID' }
    await deleteAsset(id)
    return { success: 'DELETED' }
  } catch (e: any) {
    return { error: e?.message ?? 'ERR' }
  }
}

export async function reorderAssetsAction(projectId: string, formData: FormData): Promise<void> {
  try {
    const ordered = JSON.parse(String(formData.get('ordered') || '[]')) as Array<{ id: string; position: number }>
    if (!Array.isArray(ordered) || ordered.length === 0) return
    await reorderAssets(projectId, ordered)
  } catch {
    // swallow for form compatibility; caller surfaces toast
  }
}
