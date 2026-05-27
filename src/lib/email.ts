import nodemailer from "nodemailer";

function createTransport() {
  return nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: Number(process.env.MAIL_PORT ?? 587),
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });
}

export async function sendPasswordResetEmail(toEmail: string, code: string, name: string): Promise<void> {
  const transport = createTransport();
  await transport.sendMail({
    from: `"GlowBook" <${process.env.MAIL_USER}>`,
    to: toEmail,
    subject: "Your GlowBook password reset code",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#fff;border-radius:16px;border:1px solid #FFE4E8;">
        <h1 style="font-size:24px;color:#E11D48;margin-bottom:8px;">GlowBook</h1>
        <p style="color:#3F3F46;margin-bottom:24px;">Hi ${name}, here is your password reset code:</p>
        <div style="background:#FFF1F2;border-radius:12px;padding:20px;text-align:center;margin-bottom:24px;">
          <span style="font-size:36px;font-weight:900;letter-spacing:8px;color:#E11D48;">${code}</span>
        </div>
        <p style="color:#71717A;font-size:13px;">This code expires in 15 minutes. If you did not request this, ignore this email.</p>
      </div>
    `,
  });
}

export async function sendBookingConfirmationEmail(
  toEmail: string,
  clientName: string,
  serviceType: string,
  bookingDate: string,
  bookingTime: string,
): Promise<void> {
  const transport = createTransport();
  await transport.sendMail({
    from: `"GlowBook" <${process.env.MAIL_USER}>`,
    to: toEmail,
    subject: `Your booking is confirmed — ${serviceType}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#fff;border-radius:16px;border:1px solid #FFE4E8;">
        <h1 style="font-size:24px;color:#E11D48;margin-bottom:8px;">GlowBook</h1>
        <p style="color:#3F3F46;margin-bottom:16px;">Hi ${clientName}, your appointment is confirmed!</p>
        <div style="background:#FFF1F2;border-radius:12px;padding:20px;margin-bottom:24px;">
          <p style="margin:0 0 8px;color:#3F3F46;"><strong>Service:</strong> ${serviceType}</p>
          <p style="margin:0 0 8px;color:#3F3F46;"><strong>Date:</strong> ${bookingDate}</p>
          <p style="margin:0;color:#3F3F46;"><strong>Time:</strong> ${bookingTime}</p>
        </div>
        <p style="color:#71717A;font-size:13px;">We look forward to seeing you. Reply to this email or WhatsApp us if you need to reschedule.</p>
      </div>
    `,
  });
}
