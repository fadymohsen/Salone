import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { email, code } = await request.json();
    if (!email || !code) return NextResponse.json({ valid: false, error: "Email and code are required." }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (!user) return NextResponse.json({ valid: false, error: "Invalid code." }, { status: 400 });

    const token = await prisma.passwordResetToken.findFirst({
      where: { userId: user.id, code, used: false, expiresAt: { gt: new Date() } },
    });

    if (!token) return NextResponse.json({ valid: false, error: "Invalid or expired code." }, { status: 400 });

    return NextResponse.json({ valid: true });
  } catch {
    return NextResponse.json({ valid: false, error: "Verification failed." }, { status: 500 });
  }
}
