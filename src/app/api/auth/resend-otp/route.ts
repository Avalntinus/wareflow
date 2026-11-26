import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { issueOtp } from "@/lib/auth";
import { otpErrorResponse } from "@/lib/otp-response";
import { consumeRateLimit, requestIp, tooManyRequests } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const parsed = z.object({ email: z.string().email(), purpose: z.enum(["REGISTER", "LOGIN"]) }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Email atau jenis verifikasi tidak valid." }, { status: 400 });

  const ip = requestIp(request);
  const email = parsed.data.email.toLowerCase();
  const [ipLimit, emailLimit] = await Promise.all([
    consumeRateLimit(`otp-resend:ip:${ip}`, 10, 60 * 60),
    consumeRateLimit(`otp-resend:email:${email.slice(0, 190)}`, 4, 10 * 60),
  ]);
  if (!ipLimit.allowed) return tooManyRequests(ipLimit.retryAfter);
  if (!emailLimit.allowed) return tooManyRequests(emailLimit.retryAfter, "Terlalu banyak permintaan kode untuk email ini. Coba lagi nanti.");

  const user = await db.user.findUnique({ where: { email } });
  // Jawaban tetap sama agar tidak bisa dipakai menebak email terdaftar.
  if (!user) return NextResponse.json({ success: true });
  try {
    const devOtp = await issueOtp(user.id, parsed.data.purpose);
    return NextResponse.json({ success: true, devOtp });
  } catch (error) {
    return otpErrorResponse(error, { message: "Kode OTP gagal dikirim. Coba lagi beberapa saat." });
  }
}
