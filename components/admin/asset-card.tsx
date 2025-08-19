'use client'

import { useActionState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trash2, ArrowUp, ArrowDown } from 'lucide-react'
import { deleteAssetAction, type SimpleState } from '@/app/actions/assets'
import type { Asset } from './asset-manager'

export function AssetCard({
  a,
  index,
  total,
  onMove,
  onDeleted,
  onError,
}: {
  a: Asset
  index: number
  total: number
  onMove: (id: string, dir: -1 | 1) => void
  onDeleted?: () => void
  onError?: (msg: string) => void
}) {
  const [delState, doDelete, deleting] = useActionState<SimpleState, FormData>(
    (_prev, formData) => deleteAssetAction(formData),
    {}
  )

  useEffect(() => {
    if (delState?.success) onDeleted?.()
    if (delState?.error) onError?.(delState.error)
  }, [delState?.success, delState?.error]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Card className="p-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">{a.title || a.kind}</div>
        <div className="flex items-center gap-1">
          <Button type="button" variant="outline" size="icon" onClick={() => onMove(a.id, -1)} disabled={index === 0}>
            <ArrowUp className="h-4 w-4" />
          </Button>
          <Button type="button" variant="outline" size="icon" onClick={() => onMove(a.id, 1)} disabled={index === total - 1}>
            <ArrowDown className="h-4 w-4" />
          </Button>
          <form
            action={doDelete}
            onSubmit={(e) => {
              if (!confirm('Delete asset?')) e.preventDefault()
            }}
          >
            <input type="hidden" name="assetId" value={a.id} />
            <Button type="submit" variant="destructive" size="icon" disabled={deleting}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>

      <div className="mt-2 text-xs text-muted-foreground">{a.kind.toUpperCase()}</div>
      {a.url ? (
        <a className="mt-2 inline-block text-sm text-blue-600 hover:underline" href={a.url} target="_blank" rel="noreferrer">
          Open
        </a>
      ) : null}
    </Card>
  )
}
