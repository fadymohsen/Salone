import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdminAuthenticated } from "@/lib/auth";
import { hashPassword } from "@/lib/user-auth";
import { randomBytes } from "node:crypto";

export async function PUT(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthenticated()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const newPassword = randomBytes(4).toString("hex");
  const passwordHash = hashPassword(newPassword);

  try {
    const user = await prisma.user.update({ where: { id }, data: { passwordHash } });
    return NextResponse.json({ email: user.email, password: newPassword });
  } catch {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthenticated()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  try {
    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "User not found or cannot be deleted" }, { status: 404 });
  }
}
