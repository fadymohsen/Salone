import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdminAuthenticated } from "@/lib/auth";

export async function GET() {
  if (!(await isAdminAuthenticated()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        points: true,
        createdAt: true,
        _count: { select: { bookings: true } },
      },
    });
    return NextResponse.json(users);
  } catch (error) {
    console.error("GET /api/admin/users:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
