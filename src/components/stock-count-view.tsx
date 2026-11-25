"use client";

import { ClipboardCheck, Info } from "lucide-react";
import { useMemo, useState } from "react";
import { Location, Product, formatNumber } from "@/lib/ui";
import { EmptyState, PageHeading, Spinner } from "@/components/ui";

export function StockCountView({
  products,
  locations,
  onSaved,
  notify,
}: {
  products: Product[];
  locations: Location[];
  onSaved: () => Promise<void>;
  notify: (kind: "success" | "error", message: string) => void;
}) {
  const initialLocation = locations.find((location) => location.code !== "BELUM-DITEMPATKAN")?.code ?? locations[0]?.code ?? "BELUM-DITEMPATKAN";
  const [locationCode, setLocationCode] = useState(initialLocation);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [showAll, setShowAll] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const rows = useMemo(
    () =>
      products
        .map((product) => ({
          product,
          systemQty: product.locations.find((location) => location.code === locationCode)?.quantity ?? 0,
        }))
        .filter((row) => showAll || row.systemQty > 0 || counts[row.product.id] !== undefined),
    [products, locationCode, showAll, counts],
  );

  const differenceCount = rows.filter((row) => {
    const counted = counts[row.product.id] ?? row.systemQty;
    return counted !== row.systemQty;
  }).length;

  function changeLocation(code: string) {
    setLocationCode(code);
    setCounts({});
    setMessage("");
    setError("");
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!rows.length) {
      setError("Tidak ada barang untuk dihitung di lokasi ini.");
      return;
    }
    setSaving(true);
    setMessage("");
    setError("");
    const items = rows.map((row) => ({
      productId: row.product.id,
      countedQty: counts[row.product.id] ?? row.systemQty,
    }));
    const response = await fetch("/api/stock-count", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locationCode, items }),
    });
    const body = await response.json().catch(() => null);
    setSaving(false);
    if (!response.ok) {
      setError(body?.error ?? "Stock Count gagal disimpan.");
      return;
    }
    setCounts({});
    await onSaved();
    setMessage("Stock Count tersimpan. Selisih stok sudah diterapkan.");
    notify("success", "Stock Count berhasil disimpan.");
  }

  return (
    <>
      <PageHeading eyebrow="Cocokkan stok sistem dengan jumlah fisik" title="Stock Count" />

      <form onSubmit={save}>
        <section className="rounded-2xl border border-[#e6e9ed] bg-white p-5 md:p-6">
          <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <label className="w-full sm:w-64">
              <span className="label">Lokasi hitung</span>
              <select value={locationCode} onChange={(event) => changeLocation(event.target.value)} className="input">
                {locations.map((location) => (
                  <option key={location.code} value={location.code}>
                    {location.name} ({location.code})
                  </option>
                ))}
              </select>
            </label>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-[11px] text-[#69757e]">
                <input
                  type="checkbox"
                  checked={showAll}
                  onChange={(event) => setShowAll(event.target.checked)}
                  className="h-4 w-4 accent-[#1f8f80]"
                />
                Tampilkan semua barang, termasuk yang stoknya 0
              </label>
              <p className="flex items-start gap-1.5 text-[11px] text-[#929ba3]">
                <Info size={13} className="mt-0.5 shrink-0" />
                Kosongkan kolom fisik untuk memakai stok sistem. Hanya selisih yang diterapkan.
              </p>
            </div>
          </div>

          {rows.length === 0 ? (
            <EmptyState
              icon={<ClipboardCheck size={22} />}
              title="Tidak ada barang di lokasi ini"
              description="Belum ada stok tercatat di lokasi yang dipilih. Aktifkan opsi tampilkan semua barang jika ingin menghitung barang baru."
            />
          ) : (
            <div>
              <div className="hidden rounded-lg bg-[#f8fafb] px-3 py-2 text-[10px] uppercase tracking-[0.1em] text-[#9aa3aa] sm:grid sm:grid-cols-[1fr_120px_140px_80px] sm:gap-3">
                <span className="font-semibold">Barang</span>
                <span className="text-right font-semibold">Stok sistem</span>
                <span className="text-right font-semibold">Jumlah fisik</span>
                <span className="text-right font-semibold">Selisih</span>
              </div>
              <div className="divide-y divide-[#f1f2f3]">
                {rows.map(({ product, systemQty }) => {
                  const counted = counts[product.id] ?? systemQty;
                  const difference = counted - systemQty;
                  return (
                    <div
                      key={product.id}
                      className="grid gap-2 py-3 sm:grid-cols-[1fr_120px_140px_80px] sm:items-center sm:gap-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold">{product.name}</p>
                        <p className="mt-0.5 text-[10px] text-[#a0a8ae]">{product.sku}</p>
                      </div>
                      <div className="flex items-center justify-between sm:block sm:text-right">
                        <span className="text-[10px] text-[#9aa3aa] sm:hidden">Stok sistem</span>
                        <span className="text-xs">
                          {formatNumber(systemQty)} <span className="text-[#9ca5ac]">{product.unit}</span>
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3 sm:block">
                        <span className="text-[10px] text-[#9aa3aa] sm:hidden">Jumlah fisik</span>
                        <input
                          type="number"
                          min="0"
                          value={counts[product.id] ?? ""}
                          placeholder={String(systemQty)}
                          onChange={(event) =>
                            setCounts((current) => ({
                              ...current,
                              [product.id]: Math.max(0, Number(event.target.value)),
                            }))
                          }
                          aria-label={`Jumlah fisik ${product.name}`}
                          className="input w-24 text-right sm:ml-auto"
                        />
                      </div>
                      <div className="flex items-center justify-between sm:block sm:text-right">
                        <span className="text-[10px] text-[#9aa3aa] sm:hidden">Selisih</span>
                        <span className="text-xs font-semibold">
                          {difference === 0 ? (
                            <span className="text-[#a0a8ae]">0</span>
                          ) : (
                            <span className={difference > 0 ? "text-[#2f9b72]" : "text-[#d97163]"}>
                              {difference > 0 ? "+" : ""}
                              {formatNumber(difference)}
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {error && <p className="mt-4 rounded-xl bg-[#fff0ee] p-3 text-xs text-[#c96c5e]">{error}</p>}
          {message && <p className="mt-4 rounded-xl bg-[#eef7f5] p-3 text-xs text-[#2b806f]">{message}</p>}

          <div className="mt-5 flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
            <p className="text-[11px] text-[#929ba3]">
              {rows.length} barang ditampilkan · {differenceCount} selisih terisi
            </p>
            <button
              type="submit"
              disabled={saving || rows.length === 0}
              className="rounded-xl bg-[#1f8f80] px-4 py-3 text-xs font-semibold text-white disabled:opacity-50"
            >
              {saving ? <Spinner label="Menyimpan..." /> : "Simpan & terapkan koreksi"}
            </button>
          </div>
        </section>
      </form>
    </>
  );
}
