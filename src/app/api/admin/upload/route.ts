import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const ext = file.name.split(".").pop() ?? "jpg";
  const blob = await put(`gallery/${Date.now()}.${ext}`, file, {
    access: "public",
  });

  return NextResponse.json({ url: blob.url });
}
