'use client'

import { useSearchParams, usePathname, useRouter } from 'next/navigation'

export function TagFilter({ tags }: { tags: Array<{ tag: string; count: number }> }) {
  const params = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const active = params.get('tag') || ''

  function toggle(t: string) {
    const p = new URLSearchParams(params.toString())
    if (active === t) p.delete('tag')
    else p.set('tag', t)
    router.replace(`${pathname}?${p.toString()}`)
  }

  if (!tags.length) return null
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map(({ tag, count }) => (
        <button
          key={tag}
          onClick={() => toggle(tag)}
          className={`px-2 py-1 text-xs rounded-full border ${active === tag ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700'}`}
          aria-pressed={active === tag}
        >
          {tag} <span className="opacity-60 ml-1">{count}</span>
        </button>
      ))}
      {active && (
        <button onClick={() => toggle(active)} className="px-2 py-1 text-xs rounded-full border bg-gray-100">
          Clear
        </button>
      )}
    </div>
  )
}
