import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdminAuthenticated } from "@/lib/auth";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await request.json();
  const item = await prisma.faq.update({
    where: { id },
    data: { question: body.question, questionAr: body.questionAr || null, answer: body.answer, answerAr: body.answerAr || null, isActive: body.isActive !== undefined ? body.isActive : undefined },
  });
  return NextResponse.json(item);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await prisma.faq.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
