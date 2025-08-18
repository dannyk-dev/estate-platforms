// app/s/[subdomain]/page.tsx
import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { protocol, rootDomain } from '@/lib/utils'
import {
  getPublicProjectByHost,
  listPublicImagesByHostAndTag,
  listPublicImageTags,
  listPublicAssetsByHost,
} from '@/app/actions/public'

const IMG_BUCKET = 'project-images'
const ASSET_BUCKET = 'project-assets'
const BASE = process.env.NEXT_PUBLIC_SUPABASE_URL!

type Search = { tag?: string }

function publicUrl(bucket: string, path: string) {
  return `${BASE}/storage/v1/object/public/${bucket}/${path}`
}

function toEmbed(url: string): { src: string; title: string } | null {
  try {
    const u = new URL(url)
    const host = u.hostname.toLowerCase()
    if (host === 'youtu.be') {
      return { src: `https://www.youtube.com/embed/${u.pathname.slice(1)}`, title: 'YouTube' }
    }
    if (host.endsWith('youtube.com')) {
      const id = u.searchParams.get('v')
      if (id) return { src: `https://www.youtube.com/embed/${id}`, title: 'YouTube' }
      if (u.pathname.startsWith('/embed/')) return { src: url, title: 'YouTube' }
    }
    if (host.endsWith('vimeo.com')) {
      const id = u.pathname.split('/').filter(Boolean).pop()
      if (id) return { src: `https://player.vimeo.com/video/${id}`, title: 'Vimeo' }
    }
    if (host.endsWith('matterport.com')) {
      return { src: url, title: 'Matterport' }
    }
  } catch {}
  return null
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ subdomain: string }>
  searchParams?: Promise<Search>
}): Promise<Metadata> {
  const { subdomain } = await params
  const host = `${subdomain}.${rootDomain}`
  const proj = await getPublicProjectByHost(host)

  if (!proj) return { title: rootDomain }

  return {
    title: `${proj.name} | ${subdomain}.${rootDomain}`,
    description: proj.headline || `Property ${proj.name} on ${subdomain}.${rootDomain}`,
    openGraph: {
      title: proj.name,
      description: proj.headline || '',
      images: proj.hero_url ? [proj.hero_url] : undefined,
    },
  }
}

export default async function SubdomainPage({
  params,
  searchParams,
}: {
  params: Promise<{ subdomain: string }>
  searchParams?: Promise<Search>
}) {
  const { subdomain } = await params
  const q = (await (searchParams ?? Promise.resolve({}))) || {}
  const host = `${subdomain}.${rootDomain}`

  const proj = await getPublicProjectByHost(host)
  if (!proj) notFound()

  const [images, tags, assets] = await Promise.all([
    listPublicImagesByHostAndTag(host, q.tag),
    listPublicImageTags(host),
    listPublicAssetsByHost(host),
  ])

  // Primary + pinned for the top carousel
  const highlights = images.filter((i: any) => i.is_primary || i.pinned_rank !== null).slice(0, 12)
  const grid = images

  return (
    <div className="min-h-screen bg-white">
      {/* Top bar */}
      <div className="sticky top-0 z-30 border-b bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
          <Link href={`${protocol}://${rootDomain}`} className="text-sm text-gray-600 hover:text-gray-900">
            {rootDomain}
          </Link>
          <span className="text-sm text-gray-500">{subdomain}.{rootDomain}</span>
        </div>
      </div>

      {/* Hero */}
      <section className="relative">
        <div className="mx-auto max-w-6xl px-4 py-8 md:py-12 grid md:grid-cols-2 gap-6 items-center">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900">{proj.name}</h1>
            {proj.headline ? <p className="mt-2 text-lg text-gray-600">{proj.headline}</p> : null}
            {proj.description ? <p className="mt-4 text-gray-700 leading-relaxed">{proj.description}</p> : null}
            <div className="mt-6 flex flex-wrap gap-2">
              {tags.map((t: any) => {
                const active = q.tag === t.tag
                const href = active ? `/s/${subdomain}` : `/s/${subdomain}?tag=${encodeURIComponent(t.tag)}`
                return (
                  <Link
                    key={t.tag}
                    href={href}
                    className={`px-3 py-1 text-xs rounded-full border transition ${
                      active ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-800 hover:bg-gray-50'
                    }`}
                  >
                    {t.tag} <span className="opacity-60 ml-1">{t.count}</span>
                  </Link>
                )
              })}
              {q.tag ? (
                <Link href={`/s/${subdomain}`} className="px-3 py-1 text-xs rounded-full border bg-gray-100">
                  Clear
                </Link>
              ) : null}
            </div>
          </div>
          <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl border bg-gray-100">
            {proj.hero_url ? (
              <Image
                src={proj.hero_url}
                alt={`${proj.name} hero`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            ) : highlights[0] ? (
              <Image
                src={publicUrl(IMG_BUCKET, highlights[0].storage_path)}
                alt={highlights[0].alt || proj.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            ) : null}
          </div>
        </div>
      </section>

      {/* Highlights carousel */}
      {highlights.length > 0 && (
        <section className="mx-auto max-w-6xl px-4">
          <h2 className="text-lg font-semibold text-gray-900">Highlights</h2>
          <div className="mt-4 relative">
            <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2">
              {highlights.map((img: any) => (
                <div key={img.id} className="snap-start shrink-0 w-[280px]">
                  <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border bg-gray-100">
                    <Image
                      src={publicUrl(IMG_BUCKET, img.storage_path)}
                      alt={img.alt || proj.name}
                      fill
                      className="object-cover"
                      sizes="280px"
                    />
                  </div>
                  {img.caption ? (
                    <p className="mt-2 text-xs text-gray-600 line-clamp-2">{img.caption}</p>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Gallery grid */}
      <section className="mx-auto max-w-6xl px-4 mt-10">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            {q.tag ? `Gallery — ${q.tag}` : 'Gallery'}
          </h2>
          <p className="text-xs text-gray-500">{grid.length} image{grid.length === 1 ? '' : 's'}</p>
        </div>

        {grid.length === 0 ? (
          <div className="mt-6 rounded-lg border bg-white p-6 text-center text-gray-500">No images yet.</div>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {grid.map((img: any) => (
              <figure key={img.id} className="group relative overflow-hidden rounded-lg border bg-gray-50">
                <div className="relative w-full aspect-[4/3]">
                  <Image
                    src={publicUrl(IMG_BUCKET, img.storage_path)}
                    alt={img.alt || proj.name}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    sizes="(max-width: 768px) 100vw, (max-width: 1280px) 33vw, 33vw"
                  />
                </div>
                {img.caption ? (
                  <figcaption className="p-2 text-sm text-gray-700">{img.caption}</figcaption>
                ) : null}
              </figure>
            ))}
          </div>
        )}
      </section>

      {/* Assets: videos, tours, floor plans, pdfs */}
      {assets.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 mt-12">
          <h2 className="text-lg font-semibold text-gray-900">More</h2>

          {/* Videos / Tours */}
          <div className="mt-4 grid gap-6 lg:grid-cols-2">
            {assets
              .filter((a: any) => a.kind === 'video' || a.kind === 'tour')
              .map((a: any) => {
                const emb = a.external_url ? toEmbed(a.external_url) : null
                return (
                  <div key={a.id} className="rounded-xl border overflow-hidden bg-white">
                    <div className="relative aspect-video w-full bg-black">
                      {emb ? (
                        <iframe
                          src={emb.src}
                          title={emb.title}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; xr-spatial-tracking"
                          allowFullScreen
                          className="absolute inset-0 h-full w-full"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-white/70 text-sm">
                          Unsupported embed
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      {a.title ? <div className="font-medium text-sm">{a.title}</div> : null}
                      {a.description ? <div className="text-xs text-gray-600 mt-1">{a.description}</div> : null}
                    </div>
                  </div>
                )
              })}
          </div>

          {/* Floor plans */}
          <div className="mt-8">
            <h3 className="text-sm font-medium text-gray-900">Floor plans</h3>
            <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {assets
                .filter((a: any) => a.kind === 'floorplan' && a.storage_path)
                .map((a: any) => (
                  <div key={a.id} className="rounded-lg border bg-white overflow-hidden">
                    <div className="relative w-full aspect-[4/3] bg-gray-100">
                      <Image
                        src={publicUrl(ASSET_BUCKET, a.storage_path)}
                        alt={a.title || 'Floor plan'}
                        fill
                        className="object-contain"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    </div>
                    {a.title || a.description ? (
                      <div className="p-3">
                        {a.title ? <div className="text-sm font-medium">{a.title}</div> : null}
                        {a.description ? <div className="text-xs text-gray-600 mt-1">{a.description}</div> : null}
                      </div>
                    ) : null}
                  </div>
                ))}
            </div>
          </div>

          {/* Documents (PDFs) */}
          <div className="mt-8">
            <h3 className="text-sm font-medium text-gray-900">Documents</h3>
            <ul className="mt-3 space-y-2">
              {assets
                .filter((a: any) => a.kind === 'pdf' && a.storage_path)
                .map((a: any) => {
                  const href = publicUrl(ASSET_BUCKET, a.storage_path)
                  return (
                    <li key={a.id} className="flex items-center justify-between rounded border bg-white px-3 py-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{a.title || 'Document'}</p>
                        {a.description ? <p className="text-xs text-gray-600 truncate">{a.description}</p> : null}
                      </div>
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        View PDF
                      </a>
                    </li>
                  )
                })}
            </ul>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="mx-auto max-w-6xl px-4 py-12">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>© {new Date().getFullYear()} {rootDomain}</span>
          <Link href={`${protocol}://${rootDomain}`} className="hover:underline">
            All properties
          </Link>
        </div>
      </footer>
    </div>
  )
}
