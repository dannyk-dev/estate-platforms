'use server'

import { createClient } from '@/lib/supabase/server'

// Public project by full host
// app/actions/public.ts

export async function getPublicProjectByHost(host: string) {
  const sb = await createClient()
  const { data, error } = await sb.rpc('get_public_project', { p_host: host })
  if (error) throw error
  return (data && data[0]) ?? null
}

export async function listPublicImagesByHostAndTag(host: string, tag?: string) {
  const sb = await createClient()
  const { data, error } = await sb.rpc('list_public_images_by_host_tag', { p_host: host, p_tag: tag ?? null })
  if (error) throw error;

  // console.log(data);
  return data ?? []
}

export async function listPublicImageTags(host: string) {
  const sb = await createClient()
  const { data, error } = await sb.rpc('list_public_image_tags_by_host', { p_host: host })
  if (error) throw error
  return data ?? []
}

export async function listPublicAssetsByHost(host: string) {
  const sb = await createClient()
  const { data, error } = await sb.rpc('list_public_assets_by_host', { p_host: host })
  if (error) throw error
  return data ?? []
}
