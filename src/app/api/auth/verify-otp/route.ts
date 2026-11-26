import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { createSession, hashOtp } from "@/lib/auth";
import { consumeRateLimit, requestIp, tooManyRequests } from "@/lib/rate-limit";

const schema = z.object({
  email: z.string().trim().email(),
  code: z.string().regex(/^\d{6}$/),
  purpose: z.enum(["REGISTER", "LOGIN"]),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Kode OTP harus 6 angka." }, { status: 400 });

  const ip = requestIp(request);
  const email = parsed.data.email.toLowerCase();
  const [ipLimit, emailLimit] = await Promise.all([
    consumeRateLimit(`otp-verify:ip:${ip}`, 30, 10 * 60),
    consumeRateLimit(`otp-verify:email:${email.slice(0, 190)}`, 10, 10 * 60),
  ]);
  if (!ipLimit.allowed) return tooManyRequests(ipLimit.retryAfter);
  if (!emailLimit.allowed) return tooManyRequests(emailLimit.retryAfter, "Percobaan verifikasi terlalu banyak. Tunggu beberapa menit.");

  const user = await db.user.findUnique({ where: { email } });
  // Pesan seragam: jangan bocorkan apakah email terdaftar.
  if (!user) return NextResponse.json({ error: "Kode OTP salah atau sudah kedaluwarsa." }, { status: 400 });
  const otp = await db.otpCode.findFirst({
    where: { userId: user.id, purpose: parsed.data.purpose, usedAt: null },
    orderBy: { createdAt: "desc" },
  });
  if (!otp || otp.expiresAt < new Date()) return NextResponse.json({ error: "Kode OTP sudah kedaluwarsa. Kirim ulang kode baru." }, { status: 400 });
  if (otp.attempts >= 5) return NextResponse.json({ error: "Percobaan OTP terlalu banyak. Kirim ulang kode baru." }, { status: 429 });
  if (otp.codeHash !== hashOtp(parsed.data.code)) {
    await db.otpCode.update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } });
    return NextResponse.json({ error: "Kode OTP salah." }, { status: 400 });
  }
  await db.otpCode.update({ where: { id: otp.id }, data: { usedAt: new Date() } });
  if (!user.emailVerifiedAt) {
    await db.user.update({ where: { id: user.id }, data: { emailVerifiedAt: new Date() } });
  }
  await createSession(user.id);
  return NextResponse.json({ success: true });
}
