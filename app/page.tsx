// app/page.tsx
import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { rootDomain, protocol } from '@/lib/utils'
import { createClient } from '@/lib/supabase/server'
import { SignOutButton } from '@/components/auth/signout-button'

export const metadata: Metadata = {
  title: `${rootDomain} — Properties`,
  description: `Browse published projects on ${rootDomain}`,
}

type ProjectRow = {
  id: string
  slug: string
  name: string
  headline: string | null
  hero_url: string | null
  created_at: string
}

export default async function HomePage() {
  const sb = await createClient()

  const { data, error } = await sb
    .from('projects')
    .select('id, slug, name, headline, hero_url, created_at')
    .eq('published', true)
    .order('created_at', { ascending: false })

  if (error) {
    // Minimal hard failure. You can render a nicer error boundary if desired.
    throw error
  }

  const projects = (data ?? []) as ProjectRow[]

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4 md:p-8">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between">
        <h1 className="text-xl text-gray-600 font-semibold  hover:text-gray-900">
          MasterChellyProjects
        </h1>
        <div className="flex space-x-2">
          <Button asChild variant="default" size="sm">
            <Link href="/admin" className="text-sm text-gray-500 hover:text-gray-700">
              Dashboard
            </Link>
          </Button>
        <SignOutButton />
        </div>
      </header>

      <main className="mx-auto mt-8 w-full max-w-6xl">
        {projects.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-gray-500">
              No published projects yet.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => {
              const href = `${protocol}://${p.slug}.${rootDomain}`
              const created = new Date(p.created_at).toLocaleDateString()
              return (
                <Card key={p.id} className="overflow-hidden">
                  <div className="relative w-full aspect-[16/9] bg-gray-100">
                    {p.hero_url ? (
                      <Image
                        src={p.hero_url}
                        alt={`${p.name} hero`}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                        className="object-cover"
                      />
                    ) : null}
                  </div>
                  <CardHeader className="pb-2">
                    <CardTitle className="truncate">{p.name}</CardTitle>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {p.headline || `${p.slug}.${rootDomain}`}
                    </p>
                  </CardHeader>
                  <CardContent className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Created: {created}</span>
                    <Button asChild size="sm" variant="outline">
                      <a href={href} target="_blank" rel="noopener noreferrer">
                        View project
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
