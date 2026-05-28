import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdminAuthenticated } from "@/lib/auth";

export async function GET() {
  if (!(await isAdminAuthenticated()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const items = await prisma.testimonial.findMany({ orderBy: { sortOrder: "asc" } });
  return NextResponse.json(items);
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const count = await prisma.testimonial.count();
  const item = await prisma.testimonial.create({
    data: { name: body.name, nameAr: body.nameAr || null, quote: body.quote, quoteAr: body.quoteAr || null, service: body.service || null, serviceAr: body.serviceAr || null, sortOrder: count },
  });
  return NextResponse.json(item, { status: 201 });
}
