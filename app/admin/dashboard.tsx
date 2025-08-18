// app/admin/dashboard.tsx  (updated)
'use client';

import { useActionState, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Trash2, Loader2, ExternalLink, Copy, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { deleteSubdomainAction } from '@/app/actions';
import { rootDomain, protocol } from '@/lib/utils';

type Project = {
  id: string;
  slug: string;
  name: string;
  published: boolean;
  createdAt: string | number;
  heroUrl?: string | null;
  domain?: string | null;
  images?: number;
};

type DeleteState = { error?: string; success?: string };

function DashboardHeader({ total, published }: { total: number; published: number }) {
  return (
    <div className="flex justify-between items-center mb-8">
      <div>
        <h1 className="text-3xl font-bold">Projects</h1>
        <p className="text-sm text-muted-foreground">
          {published} published • {total - published} drafts
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Link
          href={`${protocol}://${rootDomain}`}
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          {rootDomain}
        </Link>
        <Button asChild>
          <Link href="/admin/projects/new">
            <Plus className="h-4 w-4 mr-2" />
            New project
          </Link>
        </Button>
      </div>
    </div>
  );
}

function Badge({ children, variant = 'default' }: { children: React.ReactNode; variant?: 'default' | 'secondary' }) {
  const cls = variant === 'secondary' ? 'bg-gray-100 text-gray-700' : 'bg-emerald-100 text-emerald-700';
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>{children}</span>;
}

function DeleteButton({
  slug,
  action,
  isPending
}: {
  slug: string;
  action: (formData: FormData) => void;
  isPending: boolean;
}) {
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (isPending) return;
    if (!confirm(`Delete project "${slug}"? This removes its domain and images.`)) e.preventDefault();
  };
  return (
    <form action={action} onSubmit={onSubmit}>
      <input type="hidden" name="subdomain" value={slug} />
      <Button
        variant="ghost"
        size="icon"
        type="submit"
        disabled={isPending}
        className="text-gray-500 hover:text-red-600 hover:bg-red-50"
        aria-label={`Delete ${slug}`}
      >
        {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Trash2 className="h-5 w-5" />}
      </Button>
    </form>
  );
}

function CopyLinkButton({ href }: { href: string }) {
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };
  return (
    <Button type="button" variant="outline" size="sm" onClick={onCopy} aria-label="Copy link">
      <Copy className="h-4 w-4 mr-2" />
      {copied ? 'Copied' : 'Copy link'}
    </Button>
  );
}

function ProjectCard({
  project,
  action,
  isPending
}: {
  project: Project;
  action: (formData: FormData) => void;
  isPending: boolean;
}) {
  const href = useMemo(() => `${protocol}://${project.domain || `${project.slug}.${rootDomain}`}`, [project.domain, project.slug]);
  const created = useMemo(() => {
    const t = typeof project.createdAt === 'number' ? project.createdAt : Date.parse(project.createdAt);
    return isNaN(t) ? '' : new Date(t).toLocaleString();
  }, [project.createdAt]);

  return (
    <Card key={project.id} className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="text-xl truncate">{project.name || project.slug}</CardTitle>
            <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
              <span className="truncate">{project.slug}.{rootDomain}</span>
              {project.published ? <Badge>Published</Badge> : <Badge variant="secondary">Draft</Badge>}
              {typeof project.images === 'number' && (
                <span className="text-xs text-gray-500">{project.images} image{project.images === 1 ? '' : 's'}</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button asChild variant="outline" size="sm" className="mr-1">
              <Link href={`/admin/projects/${project.id}`}>Edit</Link>
            </Button>
            <DeleteButton slug={project.slug} action={action} isPending={isPending} />
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="relative w-full aspect-[16/9] rounded-lg border bg-muted overflow-hidden">
          {project.heroUrl ? (
            <Image
              src={project.heroUrl}
              alt={`${project.name || project.slug} hero`}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-gray-500">No hero image</div>
          )}
        </div>

        <div className="mt-4 flex items-center gap-2">
          <Link href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-blue-600 hover:underline text-sm">
            Visit <ExternalLink className="h-4 w-4 ml-1" />
          </Link>
          <CopyLinkButton href={href} />
          <span className="ml-auto text-xs text-gray-500">Created: {created}</span>
        </div>
      </CardContent>
    </Card>
  );
}

export function AdminDashboard({ projects }: { projects: Project[] }) {
  const publishedCount = projects.filter((p) => p.published).length;
  const [state, action, isPending] = useActionState<DeleteState, FormData>(deleteSubdomainAction, {});

  return (
    <div className="space-y-6 relative p-4 md:p-8">
      <DashboardHeader total={projects.length} published={publishedCount} />

      {projects.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-gray-500">No projects yet. Create one to get started.</p>
            <div className="mt-4">
              <Button asChild>
                <Link href="/admin/projects/new">
                  <Plus className="h-4 w-4 mr-2" />
                  New project
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} action={action} isPending={isPending} />
          ))}
        </div>
      )}

      {state?.error && (
        <div role="alert" className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-md">
          {state.error}
        </div>
      )}
      {state?.success && (
        <div role="status" className="fixed bottom-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded shadow-md">
          {state.success}
        </div>
      )}
    </div>
  );
}
