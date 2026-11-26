import { NextResponse } from "next/server";
import { getCurrentWorkspace } from "@/lib/auth";
import { db } from "@/lib/db";
import { assertAiQuota } from "@/lib/ai/quota";

export const maxDuration = 30;

export async function POST(request: Request) {
  const context = await getCurrentWorkspace();
  if (!context) return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
  try {
    await assertAiQuota("SCAN_NOTA", context.workspaceId);
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "Foto atau PDF nota wajib dipilih." }, { status: 400 });
    if (file.size > 1_500_000) return NextResponse.json({ error: "Ukuran nota maksimal 1,5 MB. Kompres foto sebelum mengirim." }, { status: 400 });
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Format nota harus JPG, PNG, WEBP, atau PDF." }, { status: 400 });
    }
    const apiKey = process.env.GEMINI_API_KEY;
    const model = process.env.GEMINI_MODEL;
    if (!apiKey || !model) return NextResponse.json({ error: "AI belum dikonfigurasi. Gunakan input pembelian manual.", fallback: true }, { status: 503 });
    const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(25000),
      body: JSON.stringify({
        contents: [{ parts: [{ text: "Baca nota ini dan keluarkan JSON valid dengan bentuk {supplier:string,date:string,invoiceNo:string,items:[{name:string,quantity:number,unit:string,unitCost:number,subtotal:number,confidence:number}],total:number}. Jangan menambahkan markdown." }, { inline_data: { mime_type: file.type || "image/jpeg", data: base64 } }] }],
      }),
    });
    if (!response.ok) throw new Error(response.status === 429 ? "AI_QUOTA" : "AI_PROVIDER");
    const data = (await response.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
    const raw = data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("") ?? "";
    const extracted = JSON.parse(raw.replace(/^```json\s*/i, "").replace(/```$/i, "").trim()) as unknown;
    await db.aiUsageLog.create({ data: { workspaceId: context.workspaceId, feature: "SCAN_NOTA", status: "BERHASIL" } });
    return NextResponse.json({ extracted, reviewRequired: true });
  } catch (error) {
    const code = error instanceof Error ? error.message : "AI_PROVIDER";
    await db.aiUsageLog.create({ data: { workspaceId: context.workspaceId, feature: "SCAN_NOTA", status: "GAGAL", errorCode: code } });
    return NextResponse.json({ error: code === "AI_QUOTA" ? "Kuota AI hari ini sudah habis." : "Nota belum bisa dibaca. Silakan input manual.", fallback: true }, { status: 503 });
  }
}
