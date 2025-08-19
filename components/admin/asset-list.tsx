'use client'

import { useActionState, useMemo, useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { reorderAssetsAction } from '@/app/actions/assets'
import { AssetCard } from './asset-card'
import type { Asset } from './asset-manager'

export function AssetList({
  projectId,
  initialAssets,
  onReordered,
  onDeleted,
  onError,
}: {
  projectId: string
  initialAssets: Asset[]
  onReordered?: () => void
  onDeleted?: () => void
  onError?: (msg: string) => void
}) {
  const [local, setLocal] = useState<Asset[]>(initialAssets)
  const [isSaving, startTransition] = useTransition()

  const [reState, reorder] = useActionState<void, FormData>(
    (_, formData) => reorderAssetsAction(projectId, formData),
    undefined
  )

  // reorder helpers
  const idxById = useMemo(() => new Map(local.map((v, i) => [v.id, i])), [local])

  const move = (id: string, dir: -1 | 1) => {
    const i = idxById.get(id)
    if (i == null) return
    const j = i + dir
    if (j < 0 || j >= local.length) return
    const next = local.slice()
    ;[next[i], next[j]] = [next[j], next[i]]
    next.forEach((v, k) => (v.position = k))
    setLocal(next)
  }

  const commitOrder = () => {
    const fd = new FormData()
    fd.set('ordered', JSON.stringify(local.map((v, i) => ({ id: v.id, position: i }))))
    startTransition(async () => {
      try {
        await reorder(fd)
        onReordered?.()
      } catch (e: any) {
        onError?.(e?.message || 'Failed to reorder')
      }
    })
  }

  return local.length ? (
    <>
      <div className="flex items-center gap-2">
        <Button type="button" variant="secondary" size="sm" onClick={commitOrder} disabled={isSaving}>
          Save order
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {local.map((a, i) => (
          <AssetCard
            key={a.id}
            a={a}
            index={i}
            total={local.length}
            onMove={move}
            onDeleted={onDeleted}
            onError={onError}
          />
        ))}
      </div>
    </>
  ) : (
    <div className="p-6 text-sm text-muted-foreground rounded-md border">No assets yet.</div>
  )
}
