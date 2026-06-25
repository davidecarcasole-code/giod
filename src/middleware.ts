import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicPattern = /\.(png|jpg|jpeg|gif|svg|ico|webp|css|js|woff2?)$/i;

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next/") ||
    pathname === "/login" ||
    pathname === "/favicon.ico" ||
    publicPattern.test(pathname)
  ) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get("better-auth.session_token")?.value || request.cookies.get("__Secure-better-auth.session_token")?.value;
  if (!sessionCookie) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|login).*)"],
};
