import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const services = await prisma.service.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      name: true,
      nameAr: true,
      description: true,
      descriptionAr: true,
      price: true,
      popular: true,
      iconName: true,
      availableDays: true,
      timeSlots: true,
      categoryId: true,
      category: { select: { id: true, name: true, nameAr: true } },
    },
  });
  return NextResponse.json(services);
}
