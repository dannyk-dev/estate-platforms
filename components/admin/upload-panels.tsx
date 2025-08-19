'use client'

import { useActionState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { FileUpload } from '@/components/ui/file-upload'
import { uploadAssetFilesAction, type SimpleState } from '@/app/actions/assets'

export function UploadPanels({
  projectId,
  onUploaded,
  onError,
}: {
  projectId: string
  onUploaded?: (count: number) => void
  onError?: (msg: string) => void
}) {
  // Floorplans (images)
  const [planState, uploadPlans, uploadingPlans] = useActionState<SimpleState, FormData>(
    uploadAssetFilesAction.bind(null, projectId, 'floorplan'),
    {}
  )
  // PDFs
  const [pdfState, uploadPdfs, uploadingPdfs] = useActionState<SimpleState, FormData>(
    uploadAssetFilesAction.bind(null, projectId, 'pdf'),
    {}
  )

  useEffect(() => {
    if (planState?.success) onUploaded?.(parseInt(planState.success.split(':')[1] || '1', 10) || 1)
    if (planState?.error) onError?.(planState.error)
  }, [planState?.success, planState?.error]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (pdfState?.success) onUploaded?.(parseInt(pdfState.success.split(':')[1] || '1', 10) || 1)
    if (pdfState?.error) onError?.(pdfState.error)
  }, [pdfState?.success, pdfState?.error]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="p-4 space-y-2">
        <Label>Upload floor plans (images)</Label>
        {/* FileUpload must support form actions: action={...}, encType multipart */}
        <FileUpload action={uploadPlans} accept="image/*" multiple />
        {uploadingPlans ? <p className="text-sm text-muted-foreground">Uploading…</p> : null}
      </Card>

      <Card className="p-4 space-y-2">
        <Label>Upload documents (PDF)</Label>
        <FileUpload action={uploadPdfs} accept="application/pdf" multiple />
        {uploadingPdfs ? <p className="text-sm text-muted-foreground">Uploading…</p> : null}
      </Card>
    </div>
  )
}
