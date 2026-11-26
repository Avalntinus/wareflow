import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { ensureWorkspaceForUser, issueOtp } from "@/lib/auth";
import { consumeRateLimit, requestIp, tooManyRequests } from "@/lib/rate-limit";
import { otpErrorResponse } from "@/lib/otp-response";

const schema = z.object({
  name: z.string().trim().min(2),
  email: z.string().trim().email(),
  password: z.string().min(8),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Nama, email, dan kata sandi minimum 8 karakter wajib diisi." }, { status: 400 });

  const limit = await consumeRateLimit(`register:ip:${requestIp(request)}`, 5, 60 * 60);
  if (!limit.allowed) return tooManyRequests(limit.retryAfter, "Terlalu banyak pendaftaran dari jaringan ini. Coba lagi nanti.");

  const email = parsed.data.email.toLowerCase();
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) return NextResponse.json({ error: "Email sudah terdaftar. Silakan masuk." }, { status: 409 });
  const user = await db.user.create({
    data: {
      name: parsed.data.name,
      email,
      passwordHash: await hash(parsed.data.password, 12),
      role: "USER",
    },
  });
  await ensureWorkspaceForUser(user);
  try {
    const devOtp = await issueOtp(user.id, "REGISTER");
    return NextResponse.json({ requiresOtp: true, purpose: "REGISTER", email: user.email, devOtp }, { status: 201 });
  } catch (error) {
    return otpErrorResponse(error, {
      requiresOtp: true,
      purpose: "REGISTER",
      email: user.email,
      message: "Akun dibuat, tetapi kode OTP gagal dikirim. Coba kirim ulang atau hubungi pemilik.",
    });
  }
}
