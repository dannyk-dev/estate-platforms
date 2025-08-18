// app/login/ui.tsx
'use client'

import { useActionState } from 'react'
import { loginAction, type AuthState } from '@/lib/auth/actions'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export function LoginForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(loginAction, {})
  return (
    <div className="min-h-screen grid place-items-center bg-gray-50 p-4">
      <Card className="w-full max-w-sm p-6 space-y-4">
        <h1 className="text-xl font-semibold">Sign in</h1>
        <form action={action} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" autoComplete="current-password" required />
          </div>
          {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
        {process.env.NEXT_PUBLIC_ALLOW_SELF_SIGNUP === 'true' && (
          <p className="text-xs text-muted-foreground">
            No account? <Link className="underline" href="/signup">Create one</Link>
          </p>
        )}
      </Card>
    </div>
  )
}
