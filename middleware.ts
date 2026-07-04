import { NextRequest, NextResponse } from "next/server"

// Routes that don't require authentication
const PUBLIC_PATHS = ["/sign-in", "/sign-up", "/api/auth"]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public paths and static assets through
  const isPublic =
    PUBLIC_PATHS.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.match(/\.(png|jpg|jpeg|svg|ico|webp|css|js|woff2?)$/)

  if (isPublic) return NextResponse.next()

  // Check for Better Auth session cookie
  // Better Auth sets "better-auth.session_token" (or prefixed variant)
  const sessionCookie =
    request.cookies.get("better-auth.session_token") ??
    request.cookies.get("__Secure-better-auth.session_token")

  if (!sessionCookie?.value) {
    const signInUrl = new URL("/sign-in", request.url)
    // Preserve the original destination so we can redirect back after login
    signInUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(signInUrl)
  }

  return NextResponse.next()
}

export const config = {
  // Run on all routes except Next.js internals and static files
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
