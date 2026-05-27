import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdminAuthenticated } from "@/lib/auth";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminAuthenticated()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  const image = await prisma.galleryImage.update({
    where: { id },
    data: {
      title: body.title,
      imageUrl: body.imageUrl,
      serviceId: body.serviceId || null,
      sortOrder: body.sortOrder != null ? Number(body.sortOrder) : undefined,
      isActive: body.isActive != null ? Boolean(body.isActive) : undefined,
    },
  });

  return NextResponse.json(image);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminAuthenticated()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.galleryImage.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
