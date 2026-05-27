import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdminAuthenticated } from "@/lib/auth";

async function getOrCreateConfig() {
  const existing = await prisma.pointsConfig.findFirst();
  if (existing) return existing;
  return prisma.pointsConfig.create({ data: {} });
}

export async function GET() {
  if (!(await isAdminAuthenticated()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const config = await getOrCreateConfig();
  return NextResponse.json(config);
}

export async function PUT(request: Request) {
  if (!(await isAdminAuthenticated()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { pointsPerBooking, pointsThreshold, couponDiscount } = await request.json();
  const config = await getOrCreateConfig();

  const updated = await prisma.pointsConfig.update({
    where: { id: config.id },
    data: {
      pointsPerBooking: Number(pointsPerBooking),
      pointsThreshold: Number(pointsThreshold),
      couponDiscount: Number(couponDiscount),
    },
  });

  return NextResponse.json(updated);
}
