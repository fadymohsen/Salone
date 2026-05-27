import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdminAuthenticated } from "@/lib/auth";

export async function GET() {
  if (!(await isAdminAuthenticated()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const promos = await prisma.promoCode.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(promos);
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { code, discount, maxUsage } = await request.json();

  if (!code || !discount)
    return NextResponse.json({ error: "Code and discount required" }, { status: 400 });

  try {
    const promo = await prisma.promoCode.create({
      data: { code: code.toUpperCase(), discount: Number(discount), maxUsage: maxUsage ? Number(maxUsage) : null },
    });
    return NextResponse.json(promo, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Code already exists" }, { status: 409 });
  }
}
