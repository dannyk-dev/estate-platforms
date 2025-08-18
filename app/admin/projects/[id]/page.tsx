// app/admin/projects/[id]/page.tsx
import { redirect } from 'next/navigation'
import { assertAdmin } from '@/lib/auth/helpers'
import { createClient } from '@/lib/supabase/server'
// import { ProjectEditorForm } from '../project-form'
import type { Metadata } from 'next'
import { rootDomain } from '@/lib/utils'
import { ProjectEditorForm } from '@/app/admin/projects/project-form'
import { GalleryPanel } from '@/app/admin/projects/[id]/gallery-panel'

export const metadata: Metadata = {
  title: `Edit Project | ${rootDomain}`,
}

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let sb

  try { ({ sb } = await assertAdmin()) } catch { redirect('/login') }

  const { data: p, error } = await sb
    .from('projects')
    .select('id, slug, name, headline, description, hero_url, published')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  if (!p) redirect('/admin')

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <h1 className="text-2xl font-semibold">Edit project</h1>
        <ProjectEditorForm
          mode="edit"
          defaults={{
            id: p.id,
            slug: p.slug,
            name: p.name,
            headline: p.headline ?? '',
            description: p.description ?? '',
            heroUrl: p.hero_url ?? '',
            published: !!p.published,
          }}
        />
        <GalleryPanel projectId={p.id} />
      </div>
    </div>
  )
}
