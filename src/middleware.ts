import { NextResponse, type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

const GUARDED = [
  "/dashboard",
  "/forecast",
  "/staffing",
  "/roster",
  "/events",
  "/recommendations",
  "/onboarding",
  "/settings",
  "/team",
  "/roles",
];

export async function middleware(request: NextRequest) {
  const response = await updateSession(request);
  const path = request.nextUrl.pathname;
  const needsAuth = GUARDED.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
  if (needsAuth && !request.cookies.get("ss_user")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
