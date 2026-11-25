"use client";

import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  ChevronRight,
  MapPin,
  PackagePlus,
  Plus,
  Sparkles,
} from "lucide-react";
import { DashboardSummary, Product, formatNumber, formatRupiah } from "@/lib/ui";
import { ProductTable } from "@/components/product-table";

export function DashboardView({
  summary,
  products,
  onAdd,
  onAi,
  onNavigate,
  onEdit,
  onDelete,
}: {
  summary: DashboardSummary;
  products: Product[];
  onAdd: () => void;
  onAi: () => void;
  onNavigate: (page: "barang" | "pembelian" | "stock-count") => void;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}) {
  const firstName = summary.user.name.split(/\s+/)[0] || "Pengguna";
  const attention = products.filter((product) => product.status !== "Aman").slice(0, 4);
  const categories = summary.categories.slice(0, 6);
  const maxUnits = Math.max(1, ...categories.map((category) => category.units));
  const safeCount = products.filter((product) => product.status === "Aman").length;
  const barTones = ["var(--wd-teal)", "var(--wd-coral)", "var(--wd-ochre)", "var(--wd-ink)", "var(--wd-teal)", "var(--wd-coral)"];

  return (
    <>
      <div className="wd-view-head">
        <div>
          <p>Selamat datang kembali, {firstName}</p>
          <h1>Ringkasan</h1>
          <p className="mt-2">Kondisi stok hari ini, diambil langsung dari catatan gudang Anda.</p>
        </div>
        <div className="wd-view-actions">
          <button type="button" className="wd-secondary" onClick={onAi}>
            <Sparkles /> Tanya Stok
          </button>
          <button type="button" className="wd-primary" onClick={onAdd}>
            <Plus /> Tambah barang
          </button>
        </div>
      </div>

      <div className="grid gap-3 xl:grid-cols-[1.02fr_1fr]">
        <section className="wd-panel flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-[13px] font-bold">Nilai persediaan</h2>
                <p className="mt-1 text-[11px] text-[#8b959d]">Harga modal rata-rata seluruh barang</p>
              </div>
              <span className="rounded-md bg-[#f8fafb] px-2 py-1 text-[10px] font-extrabold tracking-wide">IDR</span>
            </div>
            <p className="mt-4 text-[clamp(30px,4vw,54px)] font-extrabold leading-none tracking-[-0.075em]">
              {formatRupiah(summary.inventoryValue)}
            </p>
            <p className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-[#8b959d]">
              <span className="inline-flex items-center gap-1 rounded-md bg-[#e8f6f3] px-1.5 py-1 font-bold text-[#2c8e7a]">
                <PackagePlus size={11} /> {formatNumber(summary.totalUnits)} unit
              </span>
              tersimpan di {summary.locationCount} lokasi aktif
            </p>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2">
            <button type="button" className="wd-primary" onClick={() => onNavigate("barang")}>
              Lihat barang <ArrowRight />
            </button>
            <button type="button" className="wd-secondary" onClick={() => onNavigate("stock-count")}>
              Stock Count
            </button>
          </div>

          <div className="mt-4 flex rounded-xl bg-[#f8fafb] px-1 py-2">
            {[
              ["Kategori", String(summary.categories.length)],
              ["Aman", String(safeCount)],
              ["Lokasi", String(summary.locationCount)],
            ].map(([label, value], index) => (
              <div key={label} className={`min-w-0 flex-1 px-3 ${index > 0 ? "border-l border-[#eef0f2]" : ""}`}>
                <span className="block text-[9px] text-[#8b959d]">{label}</span>
                <strong className="mt-1 block text-[12px] font-extrabold">{value}</strong>
              </div>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-2 gap-3">
          <SummaryCard
            label="Total unit stok"
            value={formatNumber(summary.totalUnits)}
            helper={`${summary.locationCount} lokasi terisi`}
            icon={<PackagePlus />}
            tone="teal"
          />
          <SummaryCard
            label="Jenis barang"
            value={String(summary.productCount)}
            helper={`${summary.categories.length} kategori`}
            icon={<Boxes />}
          />
          <SummaryCard
            label="Lokasi aktif"
            value={String(summary.locationCount)}
            helper="rak dan gudang"
            icon={<MapPin />}
          />
          <SummaryCard
            label="Perlu perhatian"
            value={String(summary.lowStock)}
            helper="menipis atau habis"
            icon={<AlertTriangle />}
            tone="coral"
          />
        </div>
      </div>

      <div className="mt-3 grid gap-3 xl:grid-cols-[1.55fr_1fr]">
        <section className="wd-panel">
          <div className="wd-panel-head">
            <div>
              <h2>Stok per kategori</h2>
              <p>Jumlah unit di seluruh lokasi</p>
            </div>
            <button type="button" onClick={() => onNavigate("barang")} className="text-[11px] font-bold text-[#20897b]">
              Lihat barang <ChevronRight className="inline" size={13} />
            </button>
          </div>

          {categories.length === 0 ? (
            <p className="rounded-xl bg-[#f8fafb] px-4 py-10 text-center text-xs text-[#8b959d]">
              Belum ada barang untuk ditampilkan.
            </p>
          ) : (
            <>
              <div className="flex h-[168px] items-end gap-2 sm:gap-3">
                {categories.map((category, index) => (
                  <div key={category.name} className="group flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2">
                    <span className="text-[10px] font-bold text-[#8b959d] opacity-0 transition group-hover:opacity-100">
                      {formatNumber(category.units)}
                    </span>
                    <div className="flex w-full flex-1 items-end">
                      <div
                        className="w-full rounded-t-[6px] transition-[height] duration-500"
                        style={{
                          height: `${Math.max(category.units > 0 ? 4 : 2, Math.round((category.units / maxUnits) * 100))}%`,
                          background: barTones[index % barTones.length],
                          opacity: category.units > 0 ? 1 : 0.25,
                        }}
                        title={`${category.name}: ${formatNumber(category.units)} unit`}
                      />
                    </div>
                    <span className="w-full truncate text-center text-[9px] text-[#8b959d]">{category.name}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-[#eef0f2] pt-3">
                <span className="flex items-center gap-2 text-[11px] text-[#8b959d]">
                  <span className="h-2 w-2 rounded-full bg-[#2a9d8f]" /> {formatNumber(summary.totalUnits)} unit terdata
                </span>
                <span className="text-[11px] font-semibold text-[#8b959d]">{categories.length} kategori</span>
              </div>
            </>
          )}
        </section>

        <section className="wd-panel">
          <div className="wd-panel-head">
            <div>
              <h2>Perlu perhatian</h2>
              <p>Segera periksa barang berikut</p>
            </div>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#f8fafb] text-[#8b959d]">
              <AlertTriangle size={14} />
            </span>
          </div>

          {attention.length === 0 ? (
            <div className="rounded-xl border border-[#cce8e1] bg-[#f4fbf9] px-4 py-8 text-center">
              <p className="text-xs font-semibold text-[#2b806f]">Semua stok dalam kondisi aman.</p>
              <p className="mt-1 text-[11px] text-[#7a9a93]">Tidak ada barang menipis atau habis.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {attention.map((product) => (
                <div key={product.id} className="flex items-center gap-3 rounded-xl border border-[#eef0f2] bg-[#f8fafb] p-3">
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                      product.status === "Habis" ? "bg-[#fff0ee] text-[#df7566]" : "bg-[#fff5e3] text-[#d99532]"
                    }`}
                  >
                    <AlertTriangle size={15} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold">{product.name}</p>
                    <p className="mt-1 truncate text-[10px] text-[#8b959d]">
                      {product.locations.filter((location) => location.quantity > 0).map((location) => location.name).join(", ") ||
                        "Belum ditempatkan"}{" "}
                      · {product.stock} {product.unit}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-md px-2 py-1 text-[9px] font-bold ${
                      product.status === "Habis" ? "bg-[#fff0ee] text-[#d96f61]" : "bg-[#fff5e3] text-[#c48624]"
                    }`}
                  >
                    {product.status}
                  </span>
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={() => onNavigate("barang")}
            className="mt-3 w-full rounded-xl border border-[#e4e8ea] py-2.5 text-[11px] font-semibold text-[#69757e] hover:bg-[#f8fafb]"
          >
            Lihat semua perhatian
          </button>
        </section>
      </div>

      <section className="wd-panel mt-3">
        <div className="wd-panel-head">
          <div>
            <h2>Barang terbaru</h2>
            <p>Barang yang terakhir ditambahkan atau diperbarui</p>
          </div>
          <button type="button" onClick={() => onNavigate("barang")} className="text-[11px] font-bold text-[#20897b]">
            Lihat semua <ChevronRight className="inline" size={13} />
          </button>
        </div>
        {products.length === 0 ? (
          <p className="rounded-xl bg-[#f8fafb] px-4 py-10 text-center text-xs text-[#8b959d]">
            Belum ada barang. Tambahkan barang pertama untuk mulai memantau stok.
          </p>
        ) : (
          <ProductTable products={products.slice(0, 5)} onEdit={onEdit} onDelete={onDelete} />
        )}
      </section>
    </>
  );
}

function SummaryCard({
  label,
  value,
  helper,
  icon,
  tone,
}: {
  label: string;
  value: string;
  helper: string;
  icon: React.ReactNode;
  tone?: "teal" | "coral";
}) {
  const surface =
    tone === "teal"
      ? {
          background: "radial-gradient(ellipse at 5% -20%, #3a9381, transparent 68%), linear-gradient(145deg, #1e7461, #08443a)",
          borderColor: "rgb(196 248 231 / 55%)",
          color: "#fff",
        }
      : tone === "coral"
        ? {
            background: "color-mix(in srgb, var(--wd-coral) 14%, var(--wd-surface))",
            borderColor: "color-mix(in srgb, var(--wd-coral) 38%, transparent)",
            color: "var(--wd-coral)",
          }
        : { background: "var(--wd-card)", color: "var(--wd-ink)" };

  return (
    <article
      className="flex min-h-[118px] flex-col justify-between rounded-2xl border border-[#e6e9ed] p-3.5"
      style={surface}
    >
      <div className="flex items-center justify-between gap-2 text-[11px] font-bold">
        <span>{label}</span>
        <span
          className="grid h-7 w-7 place-items-center rounded-[10px]"
          style={{ background: tone === "teal" ? "rgb(235 255 247 / 16%)" : "var(--wd-inner)" }}
        >
          {icon}
        </span>
      </div>
      <div>
        <strong className="block text-[clamp(20px,2.1vw,31px)] font-extrabold leading-none tracking-[-0.05em]">{value}</strong>
        <span className={`mt-2 block text-[10px] font-semibold ${tone === "teal" ? "text-white/70" : "text-[#8b959d]"}`}>
          {helper}
        </span>
      </div>
    </article>
  );
}
