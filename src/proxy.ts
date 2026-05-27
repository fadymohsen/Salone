import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const locales = ["en", "ar"];
const defaultLocale = "en";

async function getExpectedToken(): Promise<string> {
  const enc = new TextEncoder();
  const secret = process.env.CRON_SECRET ?? "dev-secret";
  const password = process.env.ADMIN_PASSWORD ?? "admin123";

  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(password));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip API routes, static files, and Next.js internals
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Check if pathname already has a locale prefix
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  // If no locale prefix, redirect to locale-prefixed path
  if (!pathnameHasLocale) {
    const acceptLang = request.headers.get("accept-language") ?? "";
    const preferred = acceptLang.includes("ar") ? "ar" : defaultLocale;
    const url = request.nextUrl.clone();
    url.pathname = `/${preferred}${pathname}`;
    return NextResponse.redirect(url);
  }

  // Admin auth check — match /{locale}/admin/* (but not /{locale}/admin/login)
  const adminMatch = pathname.match(/^\/(en|ar)\/admin(\/.*)?$/);
  if (adminMatch) {
    const adminPath = adminMatch[2] ?? "";
    if (adminPath === "/login") return NextResponse.next();

    const session = request.cookies.get("glowbook-admin");
    const expected = await getExpectedToken();

    if (session?.value !== expected) {
      const locale = adminMatch[1];
      return NextResponse.redirect(new URL(`/${locale}/admin/login`, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
