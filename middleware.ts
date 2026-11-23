
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const roleRoutes = {
  STUDENT: "/student",
  INSTRUCTOR: "/instructor",
  ADMIN: "/admin",
} as const;

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Redirect unauthenticated users to login
  if (!token) {
    return NextResponse.redirect(
      new URL("/login", request.url)
    );
  }

  const role = token.role as keyof typeof roleRoutes;
  const roleHome = roleRoutes[role];

  // Reject tokens without a valid role
  if (!roleHome) {
    return NextResponse.redirect(
      new URL("/login", request.url)
    );
  }

  // Redirect the general dashboard to the user's role dashboard
  if (pathname === "/dashboard") {
    return NextResponse.redirect(
      new URL(roleHome, request.url)
    );
  }

  // Check the required role for protected routes
  const requiredRole = pathname.startsWith("/student/")
    || pathname === "/student"
    ? "STUDENT"
    : pathname.startsWith("/instructor/")
    || pathname === "/instructor"
    ? "INSTRUCTOR"
    : pathname.startsWith("/admin/")
    || pathname === "/admin"
    ? "ADMIN"
    : null;

  // Prevent access to another role's dashboard
  if (requiredRole && role !== requiredRole) {
    return NextResponse.redirect(
      new URL(roleHome, request.url)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/student/:path*",
    "/instructor/:path*",
    "/admin/:path*",
  ],
};
