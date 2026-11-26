import { db } from "@/lib/db";

/** IP dari proxy Vercel (header diisi platform, bukan dari klien). */
export function requestIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  return ip.slice(0, 64);
}

/**
 * Hitungan jendela tetap per key. Upsert + increment atomik, jadi aman untuk
 * beberapa request paralel. Tabel lama dibersihkan sesekali.
 */
export async function consumeRateLimit(key: string, limit: number, windowSeconds: number) {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + windowSeconds * 1000);
  const row = await db.rateLimit.upsert({
    where: { key },
    create: { key, count: 1, expiresAt },
    update: { count: { increment: 1 } },
  });

  if (row.expiresAt.getTime() <= now.getTime()) {
    await db.rateLimit.update({ where: { key }, data: { count: 1, expiresAt } });
    return { allowed: true, retryAfter: 0 };
  }

  if (Math.random() < 0.02) {
    await db.rateLimit.deleteMany({ where: { expiresAt: { lt: now } } }).catch(() => undefined);
  }

  const allowed = row.count <= limit;
  return {
    allowed,
    retryAfter: allowed ? 0 : Math.max(1, Math.ceil((row.expiresAt.getTime() - now.getTime()) / 1000)),
  };
}

export function tooManyRequests(retryAfter: number, message = "Terlalu banyak percobaan. Coba lagi nanti.") {
  const response = Response.json({ error: message }, { status: 429 });
  response.headers.set("Retry-After", String(retryAfter));
  return response;
}
