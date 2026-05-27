import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword, createUserToken, setUserCookie } from "@/lib/user-auth";

export async function POST(request: Request) {
  try {
    const { name, email, password, phone } = await request.json();

    if (!name || !email || !password)
      return NextResponse.json({ error: "Name, email, and password are required." }, { status: 400 });

    if (password.length < 8)
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });

    const exists = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (exists)
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        passwordHash: hashPassword(password),
        phone: phone?.trim() || null,
      },
    });

    const token = createUserToken(user.id);
    const { name: cookieName, value, options } = setUserCookie(token);

    const res = NextResponse.json({ success: true, user: { id: user.id, name: user.name, email: user.email, points: user.points } }, { status: 201 });
    res.cookies.set(cookieName, value, options as Parameters<typeof res.cookies.set>[2]);
    return res;
  } catch {
    return NextResponse.json({ error: "Registration failed. Please try again." }, { status: 500 });
  }
}
