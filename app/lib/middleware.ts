// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const userCookie = request.cookies.get("user")?.value;
  const user = userCookie ? JSON.parse(userCookie) : null;

  const { pathname } = request.nextUrl;

  // Protected routes
  if (pathname.startsWith("/admin") || pathname.startsWith("/student")) {
    if (!token || !user) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    // Role-based access control
    if (pathname.startsWith("/admin") && user.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/student/dashboard", request.url));
    }

    if (pathname.startsWith("/student") && user.role !== "STUDENT") {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/student/:path*"],
};
