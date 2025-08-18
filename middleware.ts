import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

const ROOT = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:3000'

function isLocalhost(host: string) {
  return /^localhost(:\d+)?$/.test(host) || /^127\.0\.0\.1(:\d+)?$/.test(host)
}

// Extract subdomain if host is like foo.example.com where ROOT is example.com
function extractSub(host: string): string | null {
  if (isLocalhost(host)) return null
  if (host === ROOT) return null
  if (host.endsWith('.vercel.app')) return null // treat preview as root
  if (!host.endsWith(ROOT)) return null
  const left = host.slice(0, -(ROOT.length + 1)) // remove .ROOT
  if (!left) return null
  return left
}

export function middleware(req: NextRequest) {
  const url = req.nextUrl
  const { pathname } = url
  const host = req.headers.get('host') || ''

  // Skip static assets and internal paths
  if (/\.(css|js|png|jpg|jpeg|webp|avif|svg|ico|gif|txt|xml|map)$/.test(pathname)) {
    return NextResponse.next()
  }
  if (pathname.startsWith('/_next') || pathname.startsWith('/api')) {
    return NextResponse.next()
  }

  const sub = extractSub(host)

  // admin.<root> -> /admin
  if (sub === 'admin') {
  // allow login and signup to pass through
  if (pathname.startsWith('/login') || pathname.startsWith('/signup')) {
    return NextResponse.next()
  }
  if (!pathname.startsWith('/admin')) {
    const url2 = url.clone()
    url2.pathname = '/admin' + (pathname === '/' ? '' : pathname)
    return NextResponse.rewrite(url2)
  }
  return NextResponse.next()
}

  if (sub && !pathname.startsWith('/s/')) {
    const url2 = url.clone()
    url2.pathname = `/s/${sub}${pathname === '/' ? '' : pathname}`
    return NextResponse.rewrite(url2)
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/:path*',
}
