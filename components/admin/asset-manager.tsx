// components/admin/asset-manager.tsx  (client)
'use client'

import { useActionState, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Trash2, ArrowUp, ArrowDown, Plus } from 'lucide-react'
// import { FileUpload } from '@/components/file-upload'
// FileUpload
import {
  createUrlAssetAction,
  uploadAssetFilesAction,
  deleteAssetAction,
  reorderAssetsAction,
  type SimpleState
} from '@/app/actions/assets'
import { FileUpload } from '@/components/ui/file-upload'

type Asset = {
  id: string
  kind: 'video'|'pdf'|'floorplan'|'tour'
  title: string | null
  description: string | null
  url: string | null
  position: number
}

export function AssetManager({ projectId, assets }: { projectId: string; assets: Asset[] }) {
  const [local, setLocal] = useState(assets)
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [url, setUrl] = useState('')
  const [kind, setKind] = useState<'video'|'tour'>('video')

  const [_u1, uploadPlans, uploadingPlans] = useActionState(uploadAssetFilesAction.bind(null, projectId, 'floorplan'), {})
  const [_u2, uploadPdfs, uploadingPdfs] = useActionState(uploadAssetFilesAction.bind(null, projectId, 'pdf'), {})

  const [_cState, createUrl, creating] = useActionState<SimpleState, FormData>(createUrlAssetAction.bind(null, projectId), {})

  const move = (id: string, dir: -1 | 1) => {
    const i = local.findIndex(a => a.id === id); if (i < 0) return
    const j = i + dir; if (j < 0 || j >= local.length) return
    const next = local.slice()
    const [a, b] = [next[i], next[j]]
    next[i] = b; next[j] = a
    next.forEach((v, k) => (v.position = k))
    setLocal(next)
  }

  const [reState, reorder, reordering] = useActionState<SimpleState, FormData>(reorderAssetsAction.bind(null, projectId), {})

  const commitOrder = () => {
    const fd = new FormData()
    fd.set('ordered', JSON.stringify(local.map((v, i) => ({ id: v.id, position: i }))))
    reorder(fd)
  }

  return (
    <div className="space-y-6">
      <Card className="p-4 space-y-3">
        <Label>Add video / tour</Label>
        <form action={createUrl} className="grid gap-3 md:grid-cols-4 items-end">
          <div className="md:col-span-1">
            <Label htmlFor="kind">Type</Label>
            <select id="kind" name="kind" className="mt-1 h-9 w-full rounded-md border px-2" value={kind} onChange={(e) => setKind(e.target.value as any)}>
              <option value="video">Video (YouTube/Vimeo)</option>
              <option value="tour">360 Tour (Matterport)</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="url">URL</Label>
            <Input id="url" name="url" value={url} onChange={(e)=>setUrl(e.target.value)} placeholder="https://..." required />
          </div>
          <div className="md:col-span-1 flex gap-2">
            <input type="hidden" name="kind" value={kind} />
            <Button type="submit" className="w-full" disabled={creating}><Plus className="h-4 w-4 mr-1" />Add</Button>
          </div>
        </form>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-4 space-y-2">
          <Label>Upload floor plans (images)</Label>
          <FileUpload onUpload={uploadPlans} />
          {uploadingPlans ? <p className="text-sm text-muted-foreground">Uploading…</p> : null}
        </Card>
        <Card className="p-4 space-y-2">
          <Label>Upload documents (PDF)</Label>
          <FileUpload onUpload={uploadPdfs} accept={{ 'application/pdf': ['.pdf'] }} />
          {uploadingPdfs ? <p className="text-sm text-muted-foreground">Uploading…</p> : null}
        </Card>
      </div>

      {local.length ? (
        <>
          <div className="flex items-center gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={commitOrder} disabled={reordering}>Save order</Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {local.map((a, i) => (
              <Card key={a.id} className="p-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">{a.title || a.kind}</div>
                  <div className="flex items-center gap-1">
                    <Button type="button" variant="outline" size="icon" onClick={()=>move(a.id,-1)} disabled={i===0}><ArrowUp className="h-4 w-4" /></Button>
                    <Button type="button" variant="outline" size="icon" onClick={()=>move(a.id,1)} disabled={i===local.length-1}><ArrowDown className="h-4 w-4" /></Button>
                    <form action={deleteAssetAction} onSubmit={(e)=>{ if(!confirm('Delete asset?')) e.preventDefault() }}>
                      <input type="hidden" name="assetId" value={a.id} />
                      <Button type="submit" variant="destructive" size="icon"><Trash2 className="h-4 w-4" /></Button>
                    </form>
                  </div>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">{a.kind.toUpperCase()}</div>
                {a.url ? (
                  <a className="mt-2 inline-block text-sm text-blue-600 hover:underline" href={a.url} target="_blank" rel="noreferrer">Open</a>
                ) : null}
              </Card>
            ))}
          </div>
        </>
      ) : (
        <Card className="p-6 text-sm text-muted-foreground">No assets yet.</Card>
      )}
    </div>
  )
}
