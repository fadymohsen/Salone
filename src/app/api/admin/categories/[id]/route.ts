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
    const category = await prisma.category.update({
      where: { id },
      data: {
        name: body.name,
        nameAr: body.nameAr || null,
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : undefined,
        sortOrder: body.sortOrder != null ? Number(body.sortOrder) : undefined,
      },
    });
    return NextResponse.json(category);
  } catch {
    return NextResponse.json({ error: "Category not found." }, { status: 404 });
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
    await prisma.category.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Category not found." }, { status: 404 });
  }
}
