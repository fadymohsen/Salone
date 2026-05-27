import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdminAuthenticated } from "@/lib/auth";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminAuthenticated()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  const promo = await prisma.promoCode.update({
    where: { id },
    data: {
      isActive: body.isActive !== undefined ? body.isActive : undefined,
      code: body.code || undefined,
      discount: body.discount !== undefined ? Number(body.discount) : undefined,
      maxUsage: body.maxUsage !== undefined ? (body.maxUsage ? Number(body.maxUsage) : null) : undefined,
      serviceIds: body.serviceIds !== undefined ? (body.serviceIds || null) : undefined,
    },
  });
  return NextResponse.json(promo);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminAuthenticated()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.promoCode.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
