import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdminAuthenticated } from "@/lib/auth";

export async function GET() {
  if (!(await isAdminAuthenticated()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const images = await prisma.galleryImage.findMany({ orderBy: { sortOrder: "asc" } });
    return NextResponse.json(images);
  } catch (error) {
    console.error("GET /api/admin/gallery:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!(await isAdminAuthenticated()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, imageUrl, serviceId } = await request.json();

  if (!title || !imageUrl)
    return NextResponse.json({ error: "Title and image URL are required" }, { status: 400 });

  try {
    const count = await prisma.galleryImage.count();
    const image = await prisma.galleryImage.create({
      data: { title, imageUrl, serviceId: serviceId || null, sortOrder: count },
    });
    return NextResponse.json(image, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/gallery:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
