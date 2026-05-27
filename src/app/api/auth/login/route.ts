import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPassword, createUserToken, setUserCookie } from "@/lib/user-auth";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password)
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (!user || !verifyPassword(password, user.passwordHash))
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });

    const token = createUserToken(user.id);
    const { name, value, options } = setUserCookie(token);

    const res = NextResponse.json({ success: true, user: { id: user.id, name: user.name, email: user.email, points: user.points } });
    res.cookies.set(name, value, options as Parameters<typeof res.cookies.set>[2]);
    return res;
  } catch {
    return NextResponse.json({ error: "Login failed. Please try again." }, { status: 500 });
  }
}
