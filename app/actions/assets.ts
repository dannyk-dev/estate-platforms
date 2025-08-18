'use server'

import crypto from 'node:crypto'
import { revalidatePath } from 'next/cache'
import { assertAdmin } from '@/lib/auth/helpers'
import { uuid } from '@/lib/validators'

const BUCKET = 'project-assets'
const ALLOWED_EMBED_HOSTS = [
  'youtube.com','www.youtube.com','youtu.be',
  'vimeo.com','player.vimeo.com',
  'matterport.com','my.matterport.com'
]
export type SimpleState = { error?: string; success?: string }
function isAllowedEmbed(u: string) {
  let url: URL
  try { url = new URL(u) } catch { return false }
  if (url.protocol !== 'https:') return false
  const host = url.hostname.toLowerCase()
  return ALLOWED_EMBED_HOSTS.some(h => host === h || host.endsWith('.' + h))
}

type Kind = 'video'|'pdf'|'floorplan'|'tour'

// Upload a file asset (pdf|floorplan)
export async function createFileAsset(projectId: string, kind: Exclude<Kind,'video'|'tour'>, file: File, meta?: { title?: string; description?: string; position?: number }) {
  const { sb } = await assertAdmin()
  const pid = uuid.parse(projectId)

  if (!(file instanceof File)) throw new Error('FILE_REQUIRED')
  const contentType = file.type || 'application/octet-stream'
  if (kind === 'pdf' && contentType !== 'application/pdf') throw new Error('PDF_ONLY')
  if (kind === 'floorplan' && !/^image\//.test(contentType)) throw new Error('IMAGE_ONLY')

  const array = new Uint8Array(await file.arrayBuffer())
  const ext = contentType === 'application/pdf' ? 'pdf' : (contentType.split('/')[1] || 'bin')
  const name = `${pid}/${crypto.randomUUID()}.${ext}`
  const up = await sb.storage.from(BUCKET).upload(name, array, {
    contentType,
    cacheControl: '31536000, immutable',
    upsert: false
  })
  if (up.error) throw up.error

  const { error } = await sb.from('project_assets').insert({
    project_id: pid,
    kind,
    title: meta?.title ?? null,
    description: meta?.description ?? null,
    storage_path: name,
    position: Math.max(0, Math.floor(meta?.position ?? 0))
  })
  if (error) throw error

  revalidatePath('/admin'); revalidatePath(`/admin/projects/${pid}`)
  return { ok: true, storagePath: name }
}

// Create a URL asset (video|tour)
export async function createUrlAsset(projectId: string, kind: Extract<Kind,'video'|'tour'>, externalUrl: string, meta?: { title?: string; description?: string; position?: number }) {
  const { sb } = await assertAdmin()
  const pid = uuid.parse(projectId)
  const url = String(externalUrl || '').trim()
  if (!isAllowedEmbed(url)) throw new Error('EMBED_HOST_NOT_ALLOWED')

  const { error } = await sb.from('project_assets').insert({
    project_id: pid,
    kind,
    title: meta?.title ?? null,
    description: meta?.description ?? null,
    external_url: url,
    position: Math.max(0, Math.floor(meta?.position ?? 0))
  })
  if (error) throw error

  revalidatePath('/admin'); revalidatePath(`/admin/projects/${pid}`)
  return { ok: true }
}

export async function deleteAsset(assetId: string) {
  const { sb } = await assertAdmin()
  const id = uuid.parse(assetId)
  const { data: a, error: e0 } = await sb.from('project_assets').select('project_id, storage_path').eq('id', id).single()
  if (e0) throw e0

  if (a.storage_path) {
    const del = await sb.storage.from(BUCKET).remove([a.storage_path])
    if (del.error) throw del.error
  }
  const { error } = await sb.from('project_assets').delete().eq('id', id)
  if (error) throw error

  revalidatePath('/admin'); revalidatePath(`/admin/projects/${a.project_id}`)
  return { ok: true }
}

export async function reorderAssets(projectId: string, ordered: Array<{ id: string; position: number }>) {
  const { sb } = await assertAdmin()
  const pid = uuid.parse(projectId)
  const ids = ordered.map(o => o.id)

  const { data: rows, error: e0 } = await sb.from('project_assets').select('id, project_id').in('id', ids)
  if (e0) throw e0
  if (rows.some(r => r.project_id !== pid)) throw new Error('ASSET_PROJECT_MISMATCH')

  for (const o of ordered) {
    const { error } = await sb.from('project_assets').update({ position: Math.max(0, Math.floor(o.position)) }).eq('id', o.id)
    if (error) throw error
  }
  revalidatePath('/admin'); revalidatePath(`/admin/projects/${pid}`)
  return { ok: true }
}

export async function createUrlAssetAction(projectId: string, _prev: SimpleState, formData: FormData): Promise<SimpleState> {
  try {
    const kind = String(formData.get('kind')||'video') as 'video'|'tour'
    const url = String(formData.get('url')||'')
    await createUrlAsset(projectId, kind, url, {})
    return { success: 'Added' }
  } catch (e:any) { return { error: e?.message ?? 'ERR' } }
}

export async function uploadAssetFilesAction(projectId: string, kind: 'pdf'|'floorplan', _prev: SimpleState, formData: FormData): Promise<SimpleState> {
  try {
    const files = formData.getAll('files').filter((f): f is File => f instanceof File)
    for (const f of files) await createFileAsset(projectId, kind, f, {})
    return { success: `Uploaded ${files.length}` }
  } catch (e:any) { return { error: e?.message ?? 'ERR' } }
}

export async function deleteAssetAction(_prev: SimpleState, formData: FormData): Promise<SimpleState> {
  try { await deleteAsset(String(formData.get('assetId')||'')); return { success: 'Deleted' } } catch (e:any) { return { error: e?.message ?? 'ERR' } }
}

export async function reorderAssetsAction(projectId: string, _prev: SimpleState, formData: FormData): Promise<SimpleState> {
  try {
    const ordered = JSON.parse(String(formData.get('ordered')||'[]')) as Array<{id:string;position:number}>
    await reorderAssets(projectId, ordered)
    return { success: 'Order saved' }
  } catch (e:any) { return { error: e?.message ?? 'ERR' } }
}
