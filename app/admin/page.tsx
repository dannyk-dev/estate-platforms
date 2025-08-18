// app/admin/page.tsx
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { AdminDashboard } from './dashboard'
import { rootDomain } from '@/lib/utils'
import { assertAdmin } from '@/lib/auth/helpers'

export const metadata: Metadata = {
  title: `Admin Dashboard | ${rootDomain}`,
  description: `Manage projects for ${rootDomain}`,
}

type ProjectRow = {
  id: string
  slug: string
  name: string
  published: boolean
  created_at: string
  hero_url: string | null
}

export default async function AdminPage() {
  let sb
  try {
    ;({ sb } = await assertAdmin())
  } catch {
    redirect('/')
  }

  // Fetch projects
  const { data: rows, error } = await sb
    .from('projects')
    .select('id, slug, name, published, created_at, hero_url')
    .order('created_at', { ascending: false })
  if (error) throw error

  // Optional image counts
  const ids = rows?.map((r: ProjectRow) => r.id) ?? []
  let counts = new Map<string, number>()
  if (ids.length) {
    const { data: imgs, error: e2 } = await sb
      .from('project_images')
      .select('project_id')
      .in('project_id', ids)
    if (e2) throw e2
    counts = imgs.reduce((m: Map<string, number>, r: { project_id: string }) => {
      m.set(r.project_id, (m.get(r.project_id) ?? 0) + 1)
      return m
    }, new Map())
  }

  const projects = (rows as ProjectRow[]).map((r) => ({
    id: r.id,
    slug: r.slug,
    name: r.name,
    published: r.published,
    createdAt: r.created_at,
    heroUrl: r.hero_url ?? undefined,
    domain: `${r.slug}.${rootDomain}`,
    images: counts.get(r.id) ?? 0,
  }))

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <AdminDashboard projects={projects} />
    </div>
  )
}
