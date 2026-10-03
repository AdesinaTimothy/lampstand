import { NextResponse, type NextRequest } from "next/server";

// Optimistic gate only: redirects signed-out visitors before rendering private
// pages. Real authorization happens in every page, action and route handler.
const PRIVATE_PREFIXES = ["/dashboard", "/my-courses", "/certificates", "/bookmarks", "/notifications", "/profile", "/settings", "/instructor", "/admin", "/learn"];
const SESSION_COOKIES = ["lampstand_session", "__Secure-lampstand_session"];

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const isPrivate = PRIVATE_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (!isPrivate) return NextResponse.next();
  // Preview lessons are public; the player decides per lesson.
  if (pathname.startsWith("/learn/")) return NextResponse.next();
  const hasSession = SESSION_COOKIES.some((name) => request.cookies.has(name));
  if (hasSession) return NextResponse.next();
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.search = `?next=${encodeURIComponent(pathname + search)}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"],
};
