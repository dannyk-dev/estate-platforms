// app/admin/projects/new/page.tsx
import { redirect } from 'next/navigation'
import { assertAdmin } from '@/lib/auth/helpers'
// import { ProjectEditorForm } from '../project-form'
import type { Metadata } from 'next'
import { rootDomain } from '@/lib/utils'
import { ProjectEditorForm } from '@/app/admin/projects/project-form'

export const metadata: Metadata = {
  title: `New Project | ${rootDomain}`,
}

export default async function NewProjectPage() {
  // try { await assertAdmin() } catch { redirect('/login') }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <h1 className="text-2xl font-semibold">Create project</h1>
        <ProjectEditorForm mode="create" />
      </div>
    </div>
  )
}
