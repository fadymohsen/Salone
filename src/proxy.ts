import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

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

  if (pathname === "/admin/login") return NextResponse.next();

  const session = request.cookies.get("glowbook-admin");
  const expected = await getExpectedToken();

  if (session?.value !== expected) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
