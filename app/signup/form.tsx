// app/signup/ui.tsx
'use client'

import { useActionState } from 'react'
// import { signupAction, type AuthState } from '@/app/auth/server-actions'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { AuthState, signupAction } from '@/lib/auth/actions'

export function SignupForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(signupAction, {})
  return (
    <div className="min-h-screen grid place-items-center bg-gray-50 p-4">
      <Card className="w-full max-w-sm p-6 space-y-4">
        <h1 className="text-xl font-semibold">Create account</h1>
        <form action={action} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" autoComplete="new-password" required />
          </div>
          {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? 'Creating…' : 'Sign up'}
          </Button>
        </form>
        <p className="text-xs text-muted-foreground">
          Already have an account? <Link className="underline" href="/login">Sign in</Link>
        </p>
      </Card>
    </div>
  )
}
