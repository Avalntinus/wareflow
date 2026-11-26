import { NextResponse } from "next/server";
import { getCurrentWorkspace } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const context = await getCurrentWorkspace();
  if (!context) return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
  const products = await db.product.findMany({
    where: { workspaceId: context.workspaceId, archivedAt: null },
    include: {
      category: true,
      stockLevels: { include: { location: true } },
      purchaseItems: { select: { quantity: true, unitCost: true } },
    },
    orderBy: { name: "asc" },
  });

  const rows: string[][] = [["nama", "sku", "kategori", "satuan", "stok_total", "stok_minimum", "harga_modal", "lokasi"]];
  for (const product of products) {
    const totalPurchased = product.purchaseItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalCost = product.purchaseItems.reduce((sum, item) => sum + item.quantity * item.unitCost, 0);
    const avgCost = totalPurchased > 0 ? Math.round(totalCost / totalPurchased) : product.cost;
    rows.push([
      product.name,
      product.sku ?? "",
      product.category?.name ?? "",
      product.unit,
      String(product.stockLevels.reduce((sum, level) => sum + level.quantity, 0)),
      String(product.minStock),
      String(avgCost),
      product.stockLevels.map((level) => `${level.location.name}: ${level.quantity}`).join(" | "),
    ]);
  }

  // Cegah CSV/Excel formula injection dari nama barang atau SKU yang diawali = + - @.
  const csv = rows
    .map((row) =>
      row
        .map((cell) => {
          const text = /^[=+\-@\t\r]/.test(cell) ? `'${cell}` : cell;
          return `"${text.replaceAll('"', '""')}"`;
        })
        .join(","),
    )
    .join("\n");
  return new NextResponse(`\ufeff${csv}`, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="wareflow-barang.csv"' },
  });
}
