import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { randomInt } from "node:crypto";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    if (!email) return NextResponse.json({ error: "Email is required." }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });

    // Always return success to avoid user enumeration
    if (!user) return NextResponse.json({ success: true });

    // Invalidate existing tokens
    await prisma.passwordResetToken.updateMany({
      where: { userId: user.id, used: false },
      data: { used: true },
    });

    const code = String(randomInt(100000, 999999));
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 min

    await prisma.passwordResetToken.create({
      data: { userId: user.id, code, expiresAt },
    });

    await sendPasswordResetEmail(user.email, code, user.name);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to send reset email." }, { status: 500 });
  }
}
