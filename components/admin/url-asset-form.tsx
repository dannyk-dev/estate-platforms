'use client'

import { useActionState, useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { KindSelect, type Kind } from './kind-select'
import { VideoModeTabs, TabsContent, type VideoMode } from './video-mode-tabs'
import { createUrlAssetAction, uploadAssetFilesAction, type SimpleState } from '@/app/actions/assets'

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

  // link form state
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')

  // actions
  const [linkState, createUrl, creating] = useActionState<SimpleState, FormData>(
    createUrlAssetAction.bind(null, projectId),
    {}
  )
  const [uploadState, uploadVideo, uploading] = useActionState<SimpleState, FormData>(
    uploadAssetFilesAction.bind(null, projectId, 'video'),
    {}
  )

  // toasts
  useEffect(() => {
    if (linkState?.success) {
      toast.success('Video added')
      setUrl(''); setTitle(''); setDesc('')
      onCreated?.()
    } else if (linkState?.error) {
      toast.error(linkState.error)
      onError?.(linkState.error)
    }
  }, [linkState?.success, linkState?.error]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (uploadState?.success) {
      // convention: success like "UPLOADED:3" or "UPLOADED"
      const n = Number(String(uploadState.success).split(':')[1] || 1)
      toast.success(`Uploaded ${n} video${n === 1 ? '' : 's'}`)
      onCreated?.()
    } else if (uploadState?.error) {
      toast.error(uploadState.error)
      onError?.(uploadState.error)
    }
  }, [uploadState?.success, uploadState?.error]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Card className="p-4 space-y-4">
      <div className="flex flex-col  gap-4">


        <div className="flex-1">
          <VideoModeTabs value={mode} onChange={setMode}>
            {/* LINK MODE */}
            <TabsContent value="link" className="mt-4">
              <div className="md:w-48">
          <KindSelect value={kind} onChange={setKind} />
        </div>
              <form action={createUrl} className="grid gap-3 md:grid-cols-12 items-end">
                <div className="md:col-span-7">
                  <Label htmlFor="url">URL</Label>
                  <Input
                    id="url"
                    name="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder={kind === 'video' ? 'https://youtube.com/watch?v=...' : 'https://my.matterport.com/show/?m=...'}
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
                {/* hidden kind for server-action */}
                <input type="hidden" name="kind" value={kind} />
                <div className="md:col-span-2">
                  <Button type="submit" className="w-full" disabled={creating}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>
              </form>
              <p className="text-xs text-muted-foreground mt-2">
                Allowed hosts: YouTube, Vimeo, and Matterport. Links are embedded; no file is stored.
              </p>
            </TabsContent>

            {/* UPLOAD MODE */}
            <TabsContent value="upload" className="mt-4">
              <form action={uploadVideo} className="grid gap-3 md:grid-cols-12 items-end">
                <div className="md:col-span-10">
                  <Label htmlFor="file">Video file</Label>
                  <Input id="file" name="files" type="file" accept="video/*" multiple className="cursor-pointer" />
                </div>
                <div className="md:col-span-2">
                  <Button type="submit" className="w-full" disabled={uploading}>
                    <Upload className="h-4 w-4 mr-1" />
                    Upload
                  </Button>
                </div>
              </form>
              <p className="text-xs text-muted-foreground mt-2">
                Files are stored in Supabase Storage and attached as <code>video</code> assets.
              </p>
            </TabsContent>
          </VideoModeTabs>
        </div>
      </div>
    </Card>
  )
}
