import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdminAuthenticated } from "@/lib/auth";
import { createHash, randomBytes } from "node:crypto";

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, phone, email } = await request.json();

  if (!name || !email)
    return NextResponse.json({ error: "Name and email are required" }, { status: 400 });

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing)
    return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 });

  const password = randomBytes(4).toString("hex"); // 8 char random password
  const passwordHash = createHash("sha256").update(password).digest("hex");

  const user = await prisma.user.create({
    data: { name, email, phone: phone || null, passwordHash },
  });

  return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, phone: user.phone }, password }, { status: 201 });
}
