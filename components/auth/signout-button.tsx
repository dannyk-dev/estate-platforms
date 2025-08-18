// components/auth/signout-button.tsx
'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { logoutAction } from '@/lib/auth/actions'
// import { logoutAction } from '@/app/auth/server-actions'

export function SignOutButton() {
  const [p, start] = useTransition()
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => start(() => logoutAction())}
      disabled={p}
      aria-busy={p}
    >
      {p ? 'Signing out…' : 'Sign out'}
    </Button>
  )
}
