import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  // Skip middleware for API routes, static files, and auth callback
  if (
    req.nextUrl.pathname.startsWith("/api/") ||
    req.nextUrl.pathname.startsWith("/_next/") ||
    req.nextUrl.pathname.startsWith("/auth/callback") ||
    req.nextUrl.pathname.includes(".")
  ) {
    return res
  }

  try {
    const supabase = createMiddlewareClient({ req, res })
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // If user is signed in and the current path is /auth redirect the user to /
    if (user && req.nextUrl.pathname === "/auth") {
      return NextResponse.redirect(new URL("/", req.url))
    }

    // If user is not signed in and the current path is not /auth redirect the user to /auth
    if (!user && req.nextUrl.pathname !== "/auth") {
      return NextResponse.redirect(new URL("/auth", req.url))
    }

    return res
  } catch (error) {
    console.error("Middleware error:", error)
    // If there's an error, redirect to auth
    if (req.nextUrl.pathname !== "/auth") {
      return NextResponse.redirect(new URL("/auth", req.url))
    }
    return res
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
