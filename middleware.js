import { NextResponse } from "next/server";

export async function middleware(req) {
  const res = NextResponse.next();
  const path = req.nextUrl.pathname;

  if (path.startsWith("/admin")) {
    const sessionStr = req.cookies.get("sb-access-token");
    if (!sessionStr) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  return res;
}

export const config = {
  matcher: ["/admin/:path*"],
};
