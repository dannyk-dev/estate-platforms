// components/admin/gallery-client.tsx
'use client'

import dynamic from 'next/dynamic'

const AssetManager = dynamic(() => import('@/components/admin/asset-manager').then(m => m.AssetManager), { ssr: false })

export default function GalleryClient({
  projectId,
  assets,
}: {
  projectId: string
  assets: any[]
}) {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-8">
      {/* <section className="space-y-4">
        <h2 className="text-lg font-semibold">Images</h2>
        <ImageManager projectId={projectId} images={images} />
      </section> */}

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Assets</h2>
        <AssetManager projectId={projectId} assets={assets} />
      </section>
    </div>
  )
}
