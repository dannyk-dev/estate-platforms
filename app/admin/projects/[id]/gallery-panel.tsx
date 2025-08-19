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

  const { data: assets } = await sb.from('project_assets')
      .select('id, kind, title, description, storage_path, external_url, position, created_at')
      .eq('project_id', projectId)
      .order('position', { ascending: true })
      .order('created_at', { ascending: false });


  const assetsWith = (assets ?? []).map((a) => ({
    ...a,
    url: a.storage_path ? publicUrl(ASSET_BUCKET, a.storage_path) : a.external_url,
  }))

    return <GalleryClient projectId={projectId} assets={assetsWith} />

}
