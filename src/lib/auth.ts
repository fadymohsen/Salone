import { cookies } from "next/headers";
import { createHmac } from "node:crypto";

export function getSessionToken(): string {
  return createHmac("sha256", process.env.CRON_SECRET ?? "dev-secret")
    .update(process.env.ADMIN_PASSWORD ?? "admin123")
    .digest("hex");
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const store = await cookies();
  return store.get("glowbook-admin")?.value === getSessionToken();
}
