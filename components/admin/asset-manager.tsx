// components/admin/asset-manager.tsx
'use client'

import { Suspense, lazy } from 'react'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'

export type Asset = {
  id: string
  kind: 'video' | 'pdf' | 'floorplan' | 'tour'
  title: string | null
  description: string | null
  url: string | null
  position: number
}

const UrlAssetForm   = lazy(() => import('./url-asset-form').then(m => ({ default: m.UrlAssetForm })))
const UploadPanels   = lazy(() => import('./upload-panels').then(m => ({ default: m.UploadPanels })))
const AssetListPanel = lazy(() => import('./asset-list').then(m => ({ default: m.AssetList })))

export function AssetManager({
  projectId,
  assets,
}: {
  projectId: string
  assets: Asset[]
}) {
  return (
    <div className="space-y-6">
      {/* Create URL-based asset */}
      <Suspense fallback={<Card className="p-4">Loading…</Card>}>
        <UrlAssetForm
          projectId={projectId}
          onCreated={() => toast.success('Asset added')}
          onError={(m) => toast.error(m)}
        />
      </Suspense>

      {/* Upload floorplans + PDFs */}
      <Suspense fallback={<Card className="p-4">Loading uploaders…</Card>}>
        <UploadPanels
          projectId={projectId}
          onUploaded={(n) => toast.success(`Uploaded ${n} file${n === 1 ? '' : 's'}`)}
          onError={(m) => toast.error(m)}
        />
      </Suspense>

      {/* List + reorder + delete */}
      <Suspense fallback={<Card className="p-6">Loading assets…</Card>}>
        <AssetListPanel
          projectId={projectId}
          initialAssets={assets}
          onReordered={() => toast.success('Order saved')}
          onDeleted={() => toast.success('Asset deleted')}
          onError={(m) => toast.error(m)}
        />
      </Suspense>
    </div>
  )
}
