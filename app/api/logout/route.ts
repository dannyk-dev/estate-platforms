// app/logout/route.ts
import { NextResponse } from 'next/server'
import { signOut } from '@/lib/auth/actions'

export async function GET() {
  await signOut()
  return NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'))
}

export async function POST() {
  await signOut()
  return NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'))
}
