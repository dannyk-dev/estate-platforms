// app/admin/projects/[id]/gallery-panel.tsx  (server component)

import Image from 'next/image'
import { assertAdmin } from '@/lib/auth/helpers'


import { createClient } from '@/lib/supabase/server'
import GalleryClient from '@/app/admin/projects/[id]/gallery-client'
const IMG_BUCKET = 'project-images'
const ASSET_BUCKET = 'project-assets'
const BASE = process.env.NEXT_PUBLIC_SUPABASE_URL!

function publicUrl(bucket: string, path: string) {
  return `${BASE}/storage/v1/object/public/${bucket}/${path}`
}

export async function GalleryPanel({ projectId }: { projectId: string }) {
  await assertAdmin()
  const sb = await createClient()

  const [{ data: images, error: e1 }, { data: tags, error: e2 }, { data: assets, error: e3 }] = await Promise.all([
    sb.from('project_images')
      .select('id, storage_path, alt, caption, position, is_primary, pinned_rank, created_at')
      .eq('project_id', projectId)
      .order('is_primary', { ascending: false })
      .order('pinned_rank', { ascending: true, nullsFirst: false })
      .order('position', { ascending: true })
      .order('created_at', { ascending: false }),
    sb.from('project_image_tags')
      .select('image_id, tag')
      .eq('project_id', projectId),
    sb.from('project_assets')
      .select('id, kind, title, description, storage_path, external_url, position, created_at')
      .eq('project_id', projectId)
      .order('position', { ascending: true })
      .order('created_at', { ascending: false }),
  ])
  if (e1) throw e1
  if (e2) throw e2
  if (e3) throw e3

  const tagMap = new Map<string, string[]>()
  for (const r of tags ?? []) {
    const arr = tagMap.get(r.image_id) || []
    arr.push(r.tag)
    tagMap.set(r.image_id, arr)
  }

  const imagesWith = (images ?? []).map((i) => ({
    ...i,
    url: publicUrl(IMG_BUCKET, i.storage_path),
    tags: tagMap.get(i.id) ?? [],
  }))

  const assetsWith = (assets ?? []).map((a) => ({
    ...a,
    url: a.storage_path ? publicUrl(ASSET_BUCKET, a.storage_path) : a.external_url,
  }))

    return <GalleryClient projectId={projectId} images={imagesWith} assets={assetsWith} />

}
