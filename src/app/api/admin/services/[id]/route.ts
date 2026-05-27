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
        description: body.description || null,
        price: Number(body.price),
        isActive: Boolean(body.isActive),
        popular: Boolean(body.popular),
        iconName: body.iconName || null,
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
