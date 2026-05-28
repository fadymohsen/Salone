import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdminAuthenticated } from "@/lib/auth";

export async function GET() {
  if (!(await isAdminAuthenticated()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const items = await prisma.faq.findMany({ orderBy: { sortOrder: "asc" } });
  return NextResponse.json(items);
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const count = await prisma.faq.count();
  const item = await prisma.faq.create({
    data: { question: body.question, questionAr: body.questionAr || null, answer: body.answer, answerAr: body.answerAr || null, sortOrder: count },
  });
  return NextResponse.json(item, { status: 201 });
}
