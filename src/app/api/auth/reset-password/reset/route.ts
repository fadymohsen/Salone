import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/user-auth";

export async function POST(request: Request) {
  try {
    const { email, code, newPassword } = await request.json();

    if (!email || !code || !newPassword)
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });

    if (newPassword.length < 8)
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (!user) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

    const token = await prisma.passwordResetToken.findFirst({
      where: { userId: user.id, code, used: false, expiresAt: { gt: new Date() } },
    });

    if (!token) return NextResponse.json({ error: "Invalid or expired code." }, { status: 400 });

    await prisma.$transaction([
      prisma.user.update({ where: { id: user.id }, data: { passwordHash: hashPassword(newPassword) } }),
      prisma.passwordResetToken.update({ where: { id: token.id }, data: { used: true } }),
    ]);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Password reset failed." }, { status: 500 });
  }
}
