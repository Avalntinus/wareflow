import { NextResponse } from "next/server";
import Papa from "papaparse";
import readXlsxFile from "read-excel-file/node";
import { getCurrentWorkspace } from "@/lib/auth";
import { db } from "@/lib/db";

function parseNumber(value: unknown) {
  return Number(String(value ?? "0").replace(/\./g, "").replace(",", "."));
}

type ImportRow = Record<string, unknown>;

/** Samakan bentuk CSV (objek per baris) dan XLSX (matriks) jadi objek berheader. */
function rowsFromMatrix(matrix: unknown[][]): ImportRow[] {
  if (!matrix.length) return [];
  const headers = (matrix[0] ?? []).map((header) => String(header ?? "").trim());
  return matrix.slice(1).map((cells) => {
    const row: ImportRow = {};
    headers.forEach((header, index) => {
      if (header) row[header] = cells[index] ?? "";
    });
    return row;
  });
}

function rowsFromCsv(buffer: Buffer): ImportRow[] {
  const text = buffer.toString("utf8").replace(/^\uFEFF/, "");
  const parsed = Papa.parse<ImportRow>(text, { header: true, skipEmptyLines: "greedy" });
  if (!parsed.data.length && parsed.errors.length) {
    throw new Error(`CSV tidak terbaca: ${parsed.errors[0]?.message ?? "format tidak dikenal"}.`);
  }
  return parsed.data.map((row) =>
    Object.fromEntries(Object.entries(row).map(([key, value]) => [String(key ?? "").trim(), value])),
  );
}

export async function POST(request: Request) {
  const context = await getCurrentWorkspace();
  if (!context) return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "File wajib dipilih." }, { status: 400 });
  if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "Ukuran file maksimal 5 MB." }, { status: 400 });
  const filename = file.name.toLowerCase();
  const isCsv = filename.endsWith(".csv");
  const isXlsx = filename.endsWith(".xlsx");
  if (!isCsv && !isXlsx) {
    return NextResponse.json({ error: "Format file harus .csv atau .xlsx." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  let rows: ImportRow[];
  try {
    if (isCsv) {
      rows = rowsFromCsv(buffer);
    } else {
      const sheets = await readXlsxFile(buffer);
      rows = rowsFromMatrix((sheets[0]?.data ?? []) as unknown[][]);
    }
  } catch {
    return NextResponse.json({ error: "File tidak bisa dibaca. Periksa format kolom dan isi file." }, { status: 400 });
  }
  if (rows.length > 2000) return NextResponse.json({ error: "Maksimal 2.000 baris." }, { status: 400 });
  const errors: { row: number; reason: string }[] = [];
  let successRows = 0;
  for (const [index, row] of rows.entries()) {
    const name = String(row.nama ?? row.name ?? "").trim();
    if (!name) {
      errors.push({ row: index + 2, reason: "Kolom nama wajib diisi." });
      continue;
    }
    const normalizedName = name.toLowerCase().replace(/\s+/g, " ").trim();
    const categoryName = String(row.kategori ?? row.category ?? "Umum").trim() || "Umum";
    const locationCode = String(row.lokasi_kode ?? "BELUM-DITEMPATKAN").trim() || "BELUM-DITEMPATKAN";
    const location = await db.location.findFirst({ where: { workspaceId: context.workspaceId, code: locationCode } });
    if (!location) {
      errors.push({ row: index + 2, reason: `Lokasi ${locationCode} tidak ditemukan.` });
      continue;
    }
    const category = await db.category.findFirst({ where: { workspaceId: context.workspaceId, name: categoryName } }) ?? await db.category.create({ data: { workspaceId: context.workspaceId, name: categoryName } });
    const cost = Math.max(0, Math.round(parseNumber(row.harga_modal ?? row.cost)));
    const existingProduct = await db.product.findFirst({ where: { workspaceId: context.workspaceId, normalizedName } });
    const product = existingProduct
      ? await db.product.update({ where: { id: existingProduct.id }, data: { categoryId: category.id, updatedAt: new Date(), ...(cost > 0 ? { cost } : {}) } })
      : await db.product.create({ data: { workspaceId: context.workspaceId, name, normalizedName, sku: String(row.sku ?? "").trim() || null, categoryId: category.id, unit: String(row.satuan ?? "pcs"), minStock: Math.max(0, Math.round(parseNumber(row.stok_minimum))), cost } });
    const quantity = Math.max(0, Math.round(parseNumber(row.jumlah)));
    if (quantity > 0) {
      await db.$transaction([
        db.stockLevel.upsert({ where: { productId_locationId: { productId: product.id, locationId: location.id } }, update: { quantity: { increment: quantity } }, create: { productId: product.id, locationId: location.id, quantity } }),
        db.stockMovement.create({ data: { productId: product.id, locationId: location.id, type: "SALDO_AWAL", quantity, referenceType: "IMPORT", referenceId: file.name } }),
      ]);
    }
    successRows += 1;
  }
  await db.importBatch.create({ data: { workspaceId: context.workspaceId, filename: file.name, status: errors.length ? "SELESAI_DENGAN_ERROR" : "SELESAI", totalRows: rows.length, successRows, failedRows: errors.length, errorReport: JSON.stringify(errors) } });
  return NextResponse.json({ totalRows: rows.length, successRows, failedRows: errors.length, errors });
}
