import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdminAuthenticated } from "@/lib/auth";

export async function GET() {
  if (!(await isAdminAuthenticated()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const categories = await prisma.category.findMany({ orderBy: { sortOrder: "asc" } });
    return NextResponse.json(categories);
  } catch (error) {
    console.error("GET /api/admin/categories:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, nameAr } = await request.json();

  if (!name)
    return NextResponse.json({ error: "Name is required." }, { status: 400 });

  try {
    const count = await prisma.category.count();
    const category = await prisma.category.create({
      data: { name, nameAr: nameAr || null, sortOrder: count },
    });
    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/categories:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
