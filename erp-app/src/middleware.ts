import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/", "/api/auth/login"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.next();
  }

  const session = request.cookies.get("erp_session");
  if (!session?.value) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/products/:path*", "/orders/:path*", "/customers/:path*", "/api/:path*"],
};
