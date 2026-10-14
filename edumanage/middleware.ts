import { NextRequest, NextResponse } from "next/server";
import { verifyToken, TOKEN_COOKIE } from "./lib/auth";

const ROLE_HOME: Record<string, string> = {
  ADMIN: "/admin",
  TEACHER: "/teacher",
  STUDENT: "/student",
};

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(TOKEN_COOKIE)?.value;
  const session = token ? verifyToken(token) : null;

  const isAuthPage = pathname === "/login" || pathname === "/";
  const protectedPrefix = ["/admin", "/teacher", "/student"].find((p) =>
    pathname.startsWith(p)
  );

  if (!session) {
    if (protectedPrefix) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    return NextResponse.next();
  }

  // Logged-in users visiting login/root go to their dashboard.
  if (isAuthPage && pathname !== "/") {
    return NextResponse.redirect(new URL(ROLE_HOME[session.role] ?? "/", req.url));
  }

  // Role guard: each dashboard prefix is only for its role (admin may visit all).
  if (protectedPrefix) {
    const required: Record<string, string> = {
      "/admin": "ADMIN",
      "/teacher": "TEACHER",
      "/student": "STUDENT",
    };
    const need = required[protectedPrefix];
    if (session.role !== "ADMIN" && session.role !== need) {
      return NextResponse.redirect(new URL(ROLE_HOME[session.role] ?? "/", req.url));
    }
    // Pass identity down to pages/routes via headers.
    const res = NextResponse.next();
    res.headers.set("x-user-id", session.id);
    res.headers.set("x-user-role", session.role);
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/admin/:path*", "/teacher/:path*", "/student/:path*"],
};
