'use client'

import { useState, useActionState } from 'react'
import type { Metadata } from 'next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card } from '@/components/ui/card'
import { rootDomain } from '@/lib/utils'
import { createSubdomainAction } from '@/app/actions' // expects {subdomain,name,headline?,description?,published?}
import { createProject } from '@/app/actions/projects'

type CreateState = {
  error?: string
  success?: boolean
  subdomain?: string
}

function SubdomainInput({ defaultValue }: { defaultValue?: string }) {
  const [val, setVal] = useState(defaultValue ?? '')
  return (
    <div className="space-y-2">
      <Label htmlFor="subdomain">Subdomain</Label>
      <div className="flex items-center">
        <div className="relative flex-1">
          <Input
            id="subdomain"
            name="subdomain"
            placeholder="your-subdomain"
            value={val}
            onChange={(e) =>
              setVal(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
            }
            pattern="^[a-z0-9-]+$"
            title="Lowercase letters, numbers, and hyphens only"
            className="w-full rounded-r-none focus:z-10"
            required
          />
        </div>
        <span className="bg-gray-100 px-3 border border-l-0 border-input rounded-r-md text-gray-500 min-h-[36px] flex items-center">
          .{rootDomain}
        </span>
      </div>
      <p className="text-xs text-muted-foreground">
        Only lowercase letters, numbers, and hyphens.
      </p>
    </div>
  )
}

function NameInput({ defaultValue }: { defaultValue?: string }) {
  return (
    <div className="space-y-2">
      <Label htmlFor="name">Project name</Label>
      <Input
        id="name"
        name="name"
        placeholder="Demo Tower"
        defaultValue={defaultValue}
        required
      />
    </div>
  )
}

function HeadlineInput({ defaultValue }: { defaultValue?: string }) {
  return (
    <div className="space-y-2">
      <Label htmlFor="headline">Headline (optional)</Label>
      <Input
        id="headline"
        name="headline"
        placeholder="Ocean-view residences"
        defaultValue={defaultValue}
      />
    </div>
  )
}

function DescriptionInput({ defaultValue }: { defaultValue?: string }) {
  return (
    <div className="space-y-2">
      <Label htmlFor="description">Description (optional)</Label>
      <Textarea
        id="description"
        name="description"
        placeholder="Short description of the project"
        defaultValue={defaultValue}
        rows={4}
      />
    </div>
  )
}

function PublishToggle({ defaultChecked }: { defaultChecked?: boolean }) {
  const [checked, setChecked] = useState(!!defaultChecked)
  return (
    <div className="flex items-center justify-between rounded-md border px-3 py-2">
      <div className="space-y-0.5">
        <Label htmlFor="published">Publish now</Label>
        <p className="text-xs text-muted-foreground">
          Public pages will be visible at the subdomain.
        </p>
      </div>
      <input type="hidden" name="published" value={checked ? 'on' : ''} />
      <Switch
        id="published"
        checked={checked}
        onCheckedChange={setChecked}
        aria-label="Publish project"
      />
    </div>
  )
}

export function SubdomainForm() {
  const [state, action, isPending] = useActionState<CreateState, FormData>(
    createSubdomainAction,
    {}
  )

  return (
    <form action={action} className="space-y-4">
      <Card className="p-4 space-y-4">
        <SubdomainInput defaultValue={state?.subdomain} />
        <NameInput />
        <HeadlineInput />
        <DescriptionInput />
        <PublishToggle />
      </Card>

      {state?.error && (
        <div className="text-sm text-red-500" role="alert">
          {state.error}
        </div>
      )}
      {state?.success && state.subdomain && (
        <div className="text-sm text-green-600" role="status">
          Created {state.subdomain}.{rootDomain}. You can add images now.
        </div>
      )}

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? 'Creating…' : 'Create Project Subdomain'}
      </Button>
    </form>
  )
}
