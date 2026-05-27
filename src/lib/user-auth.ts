import { cookies } from "next/headers";
import { createHmac, scryptSync, randomBytes, timingSafeEqual } from "node:crypto";

const SESSION_SECRET = process.env.SESSION_SECRET ?? "dev-session-secret-change-in-production";

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  try {
    const derived = scryptSync(password, salt, 64).toString("hex");
    const hashBuf = Buffer.from(hash, "hex");
    const derivedBuf = Buffer.from(derived, "hex");
    if (hashBuf.length !== derivedBuf.length) return false;
    return timingSafeEqual(hashBuf, derivedBuf);
  } catch {
    return false;
  }
}

export function createUserToken(userId: string): string {
  const data = `${userId}:${Date.now()}`;
  const encoded = Buffer.from(data).toString("base64url");
  const sig = createHmac("sha256", SESSION_SECRET).update(encoded).digest("hex");
  return `${encoded}.${sig}`;
}

export async function getUserIdFromCookie(): Promise<string | null> {
  try {
    const store = await cookies();
    const raw = store.get("glowbook-user")?.value;
    if (!raw) return null;

    const dotIdx = raw.lastIndexOf(".");
    if (dotIdx === -1) return null;
    const encoded = raw.slice(0, dotIdx);
    const sig = raw.slice(dotIdx + 1);

    const expected = createHmac("sha256", SESSION_SECRET).update(encoded).digest("hex");
    const sigBuf = Buffer.from(sig, "hex");
    const expectedBuf = Buffer.from(expected, "hex");
    if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) return null;

    const data = Buffer.from(encoded, "base64url").toString();
    const [userId] = data.split(":");
    return userId || null;
  } catch {
    return null;
  }
}

export function setUserCookie(token: string): { name: string; value: string; options: object } {
  return {
    name: "glowbook-user",
    value: token,
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    },
  };
}
