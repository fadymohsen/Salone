import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import PDFDocument from "pdfkit";
import nodemailer from "nodemailer";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (
    process.env.NODE_ENV === "production" &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const targetDateString = tomorrow.toISOString().split("T")[0];

    const records = await prisma.booking.findMany({
      where: { bookingDate: targetDateString },
      orderBy: { bookingTime: "asc" },
    });

    const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({ margin: 40 });
      const buffers: Buffer[] = [];

      doc.on("data", (chunk) => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", reject);

      doc.fillColor("#E11D48").fontSize(26).text("GlowBook Egypt", { align: "center" });
      doc
        .fillColor("#3F3F46")
        .fontSize(14)
        .text(`Daily Schedule: ${targetDateString}`, { align: "center" });
      doc.moveDown(2);

      if (records.length === 0) {
        doc
          .fillColor("#71717A")
          .fontSize(12)
          .text("No appointments for tomorrow.", { align: "center" });
      } else {
        doc.fontSize(11).fillColor("#E11D48");
        doc.text("Time", 40, 140, { width: 50 });
        doc.text("Client", 100, 140, { width: 180 });
        doc.text("Service", 290, 140, { width: 130 });
        doc.text("Contact", 430, 140, { width: 120 });

        doc.moveTo(40, 155).lineTo(550, 155).strokeColor("#FFF1F2").stroke();

        let y = 165;
        for (const b of records) {
          if (y > 700) {
            doc.addPage();
            y = 50;
          }
          doc.fontSize(10).fillColor("#3F3F46");
          doc.text(b.bookingTime, 40, y, { width: 50 });
          doc.text(b.clientName, 100, y, { width: 180 });
          doc.text(b.serviceType, 290, y, { width: 130 });
          doc.text(
            `${b.clientPhone}${b.clientEmail ? ` (${b.clientEmail})` : ""}`,
            430,
            y,
            { width: 120 }
          );
          y += 25;
        }
      }

      doc.end();
    });

    const transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: Number(process.env.MAIL_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"GlowBook Engine" <${process.env.MAIL_USER}>`,
      to: process.env.SALON_MANAGER_EMAIL,
      subject: `✨ GlowBook Schedule: ${targetDateString}`,
      text: `Hello Glam Team! Attached is the booking roster for tomorrow (${targetDateString}). Keep shining! ✨`,
      attachments: [
        {
          filename: `Schedule_${targetDateString}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    });

    return NextResponse.json({ success: true, processedCount: records.length });
  } catch (error) {
    console.error("Cron error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
