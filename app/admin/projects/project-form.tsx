// app/admin/projects/project-form.tsx
'use client'

import { useActionState, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card } from '@/components/ui/card'
import { rootDomain, protocol } from '@/lib/utils'
import Link from 'next/link'
import { saveProjectAction, type SaveState } from '@/app/actions/projects'
import { FileUpload } from '@/components/ui/file-upload'
import { uploadImagesAction, type SimpleState } from '@/app/actions/images'

export function ProjectEditorForm({
  mode,
  defaults,
}: {
  mode: 'create' | 'edit'
  defaults?: { id: string; slug: string; name: string; headline: string; description: string; heroUrl: string; published: boolean }
}) {
  const [published, setPublished] = useState(defaults?.published ?? false)
  const [state, action, isPending] = useActionState<SaveState, FormData>(saveProjectAction, {})

  // separate upload action (not nested in the save form)
  const [uState, upload, uploading] = useActionState<SimpleState, FormData>(
    (state, form) => uploadImagesAction(defaults?.id ?? '', form),
    {}
  )

  return (
    <>
      {/* MAIN SAVE FORM */}
      <form action={action} className="space-y-6">
        <input type="hidden" name="mode" value={mode} />
        {mode === 'edit' && <input type="hidden" name="id" value={defaults?.id} />}

        <Card className="p-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" defaultValue={defaults?.name} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Subdomain</Label>
              <div className="flex">
                <Input
                  id="slug"
                  name="slug"
                  placeholder="your-subdomain"
                  defaultValue={defaults?.slug}
                  className="rounded-r-none"
                  pattern="^[a-z0-9-]+$"
                  title="Lowercase letters, numbers, and hyphens only"
                  required
                  readOnly={mode === 'edit'}
                />
                <span className="bg-gray-100 px-3 border border-l-0 border-input rounded-r-md text-gray-500 min-h-[36px] flex items-center">
                  .{rootDomain}
                </span>
              </div>
              {mode === 'edit' && (
                <p className="text-xs text-muted-foreground">Slug cannot be changed after creation.</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="headline">Headline</Label>
              <Input id="headline" name="headline" defaultValue={defaults?.headline} placeholder="Ocean-view residences" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="heroUrl">Hero image URL</Label>
              <Input id="heroUrl" name="heroUrl" defaultValue={defaults?.heroUrl} placeholder="https://..." />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" rows={5} defaultValue={defaults?.description} />
          </div>

          <div className="flex items-center justify-between rounded-md border px-3 py-2">
            <div className="space-y-0.5">
              <Label htmlFor="published">Publish</Label>
              <p className="text-xs text-muted-foreground">Publicly visible at the subdomain.</p>
            </div>
            <input type="hidden" name="published" value={published ? 'on' : ''} />
            <Switch id="published" checked={published} onCheckedChange={setPublished} />
          </div>
        </Card>

        {state?.error && (
          <div className="text-sm text-red-500" role="alert">
            {state.error}
          </div>
        )}
        {state?.success && state.id && (
          <div className="text-sm text-green-600" role="status">
            Saved.{' '}
            <Link className="underline" href={`/admin/projects/${state.id}`}>
              Continue editing
            </Link>{' '}
            or{' '}
            <a
              className="underline"
              href={`${protocol}://${state.slug}.${rootDomain}`}
              target="_blank"
              rel="noreferrer"
            >
              view site
            </a>
            .
          </div>
        )}

        <div className="flex gap-2 justify-end">
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Saving…' : mode === 'create' ? 'Create' : 'Save changes'}
          </Button>
        </div>
      </form>

      {mode === 'edit' && defaults?.id ? (
        <Card className="mt-6 p-4 space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Gallery</h2>
            <p className="text-sm text-muted-foreground">
              Upload images for this project. Stored under <code>{defaults.id}/&lt;uuid&gt;.ext</code> in Supabase.
            </p>
          </div>
          <FileUpload action={upload} name="images" accept="image/*" multiple />
          {uploading && <p className="text-sm text-muted-foreground">Uploading…</p>}
          {uState?.error && <p className="text-xs text-red-600">{uState.error}</p>}
          {uState?.success && <p className="text-xs text-green-600">{uState.success}</p>}
        </Card>
      ) : null}
    </>
  )
}
