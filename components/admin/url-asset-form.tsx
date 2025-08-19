// components/admin/assets/url-asset-form.tsx
'use client'

import { useActionState, useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { KindSelect, type Kind } from './kind-select'
import { VideoModeTabs, TabsContent, type VideoMode } from './video-mode-tabs'
import { FileUpload } from '@/components/ui/file-upload'
import {
  createUrlAssetAction,
  uploadAssetFilesAction,
  type SimpleState,
} from '@/app/actions/assets'

export function UrlAssetForm({
  projectId,
  onCreated,
  onError,
}: {
  projectId: string
  onCreated?: () => void
  onError?: (msg: string) => void
}) {
  const [kind, setKind] = useState<Kind>('video')
  const [mode, setMode] = useState<VideoMode>('link')

  // force link mode for tours
  useEffect(() => {
    if (kind === 'tour' && mode === 'upload') setMode('link')
  }, [kind, mode])

  // link form state
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')

  // actions
  const [linkState, createUrl, creating] = useActionState<SimpleState, FormData>(
    createUrlAssetAction.bind(null, projectId),
    {}
  )
  const [uploadState, uploadVideo] = useActionState<SimpleState, FormData>(
    (_prev, fd) => uploadAssetFilesAction(projectId, 'video', _prev, fd),
    {}
  )

  // toasts
  useEffect(() => {
    if (linkState?.success) {
      toast.success('Video added')
      setUrl(''); setTitle(''); setDesc('')
      onCreated?.()
    } else if (linkState?.error) {
      toast.error(linkState.error); onError?.(linkState.error)
    }
  }, [linkState?.success, linkState?.error]) // eslint-disable-line

  useEffect(() => {
    if (uploadState?.success) {
      const n = Number(String(uploadState.success).split(':')[1] || 1)
      toast.success(`Uploaded ${n} video${n === 1 ? '' : 's'}`)
      onCreated?.()
    } else if (uploadState?.error) {
      toast.error(uploadState.error); onError?.(uploadState.error)
    }
  }, [uploadState?.success, uploadState?.error]) // eslint-disable-line

  return (
    <Card className="p-4 space-y-4">
      <div className="flex flex-col gap-4">
        <div className="w-48">
          <KindSelect value={kind} onChange={setKind} />
        </div>

        <VideoModeTabs value={mode} onChange={setMode}>
          {/* LINK MODE */}
          <TabsContent value="link" className="mt-4 data-[state=inactive]:hidden">
            <form action={createUrl} className="grid gap-3 md:grid-cols-12 items-end">
              <div className="md:col-span-7">
                <Label htmlFor="url">URL</Label>
                <Input
                  id="url"
                  name="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder={
                    kind === 'video'
                      ? 'https://youtube.com/watch?v=... or https://vimeo.com/...'
                      : 'https://my.matterport.com/show/?m=...'
                  }
                  required
                />
              </div>
              <div className="md:col-span-3">
                <Label htmlFor="title">Title</Label>
                <Input id="title" name="title" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="md:col-span-12">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" rows={2} value={desc} onChange={(e) => setDesc(e.target.value)} />
              </div>
              <input type="hidden" name="kind" value={kind} />
              <div className="md:col-span-2">
                <Button type="submit" className="w-full" disabled={creating}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
            </form>
            <p className="text-xs text-muted-foreground mt-2">
              Allowed: YouTube, Vimeo, Matterport. Links are embedded; no file is stored.
            </p>
          </TabsContent>

          {/* UPLOAD MODE — videos only */}
          <TabsContent value="upload" className="mt-4 data-[state=inactive]:hidden">
            {kind === 'tour' ? (
              <div className="rounded-md border bg-amber-50 text-amber-900 px-3 py-2 text-sm">
                Upload is for videos only. Switch type to <span className="font-medium">Video</span> to upload files.
              </div>
            ) : (
              <div className="grid gap-3">
                <Label>Video file</Label>
                <FileUpload
                  action={uploadVideo}
                  name="files"
                  accept="video/*"
                  multiple
                />
                <p className="text-xs text-muted-foreground">
                  Files are stored in Supabase Storage and attached as <code>video</code> assets.
                </p>
              </div>
            )}
          </TabsContent>
        </VideoModeTabs>
      </div>
    </Card>
  )
}
