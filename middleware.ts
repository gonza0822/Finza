import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookieName } from "@/lib/auth/sessionCookie";

/** Redirects unauthenticated visits to signed-in routes toward /login (cookie presence only). */
export function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-finza-path", request.nextUrl.pathname);

  const token = request.cookies.get(getSessionCookieName());
  if (!token) {
    const login = new URL("/login", request.url);
    login.searchParams.set("callbackUrl", request.nextUrl.pathname);
    return NextResponse.redirect(login);
  }
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: [
    "/dashboard",
    "/dashboard/:path*",
    "/inicio",
    "/inicio/:path*",
    "/movimientos",
    "/movimientos/:path*",
    "/cuentas",
    "/cuentas/:path*",
    "/tarjetas",
    "/tarjetas/:path*",
    "/planificacion",
    "/planificacion/:path*",
    "/metas",
    "/metas/:path*",
    "/proyeccion",
    "/proyeccion/:path*",
    "/mas",
    "/mas/:path*",
    "/onboarding",
    "/onboarding/:path*",
  ],
};
