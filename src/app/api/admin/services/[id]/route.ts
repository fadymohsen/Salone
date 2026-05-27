import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdminAuthenticated } from "@/lib/auth";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthenticated()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  try {
    const service = await prisma.service.update({
      where: { id },
      data: {
        name: body.name,
        nameAr: body.nameAr || null,
        description: body.description || null,
        descriptionAr: body.descriptionAr || null,
        price: Number(body.price),
        isActive: Boolean(body.isActive),
        popular: Boolean(body.popular),
        featured: body.featured !== undefined ? Boolean(body.featured) : undefined,
        pointsPrice: body.pointsPrice !== undefined ? (body.pointsPrice != null ? Number(body.pointsPrice) : null) : undefined,
        rewardDiscount: body.rewardDiscount !== undefined ? (body.rewardDiscount != null ? Number(body.rewardDiscount) : null) : undefined,
        duration: body.duration !== undefined ? Number(body.duration) : undefined,
        iconName: body.iconName || null,
        categoryId: body.categoryId !== undefined ? (body.categoryId || null) : undefined,
        sortOrder: body.sortOrder != null ? Number(body.sortOrder) : undefined,
        availableDays: body.availableDays ?? undefined,
        timeSlots: body.timeSlots ?? undefined,
      },
    });
    return NextResponse.json(service);
  } catch {
    return NextResponse.json({ error: "Service not found." }, { status: 404 });
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
    await prisma.service.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Service not found." }, { status: 404 });
  }
}
