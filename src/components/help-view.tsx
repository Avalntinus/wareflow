"use client";

import {
  ArrowRight,
  Camera,
  CircleHelp,
  FileSpreadsheet,
  Mail,
  PackagePlus,
  Search,
  ShieldCheck,
  Sparkles,
  Warehouse,
} from "lucide-react";
import { PageHeading } from "@/components/ui";

type PageKey = "barang" | "pembelian" | "lokasi" | "import" | "stock-count" | "scan-nota" | "pengaturan";

const steps = [
  {
    title: "1. Siapkan lokasi",
    description: "Buka menu Lokasi, tambahkan rak atau gudang. Kode lokasi dipakai saat pembelian dan import.",
    icon: Warehouse,
    page: "lokasi" as PageKey,
  },
  {
    title: "2. Tambah barang",
    description: "Isi nama, kategori, satuan, stok minimum, dan harga modal. Barang tanpa stok bisa dilengkapi lewat pembelian.",
    icon: PackagePlus,
    page: "barang" as PageKey,
  },
  {
    title: "3. Catat pembelian",
    description: "Pembelian menambah stok di lokasi tujuan sekaligus menyimpan harga modal rata-rata.",
    icon: FileSpreadsheet,
    page: "pembelian" as PageKey,
  },
];

export function HelpView({ onNavigate }: { onNavigate: (page: PageKey) => void }) {
  return (
    <>
      <PageHeading eyebrow="Panduan singkat pemakaian" title="Bantuan" />

      <div className="grid gap-5 xl:grid-cols-[1.4fr_0.8fr]">
        <div className="grid gap-5">
          <section className="rounded-2xl border border-[#e6e9ed] bg-white p-5 md:p-6">
            <div className="flex items-center gap-2 text-sm font-bold">
              <CircleHelp size={17} className="text-[#20897b]" /> Mulai cepat
            </div>
            <div className="mt-4 grid gap-3">
              {steps.map((step) => {
                const Icon = step.icon;
                return (
                  <button
                    key={step.title}
                    type="button"
                    onClick={() => onNavigate(step.page)}
                    className="flex items-start gap-3 rounded-xl border border-[#eef0f2] p-4 text-left transition hover:border-[#cfe0db] hover:bg-[#f8fbfa]"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#e8f6f3] text-[#20897b]">
                      <Icon size={17} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-semibold">{step.title}</span>
                      <span className="mt-1 block text-[11px] leading-5 text-[#8a949d]">{step.description}</span>
                    </span>
                    <ArrowRight size={15} className="mt-1 shrink-0 text-[#a0a8ae]" />
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded-2xl border border-[#e6e9ed] bg-white p-5 md:p-6">
            <div className="flex items-center gap-2 text-sm font-bold">
              <Search size={17} className="text-[#20897b]" /> Mencari barang
            </div>
            <ul className="mt-3 space-y-2 text-[11px] leading-5 text-[#69757e]">
              <li>• Gunakan kolom pencarian di header (pintasan <b>Ctrl/⌘ + K</b>) untuk mencari nama, SKU, kategori, atau lokasi.</li>
              <li>• Filter <b>Stok menipis</b> dan <b>Habis</b> ada di halaman Barang.</li>
              <li>• Tanya Stok bisa menjawab pertanyaan seperti &quot;Kabel HDMI ada di mana?&quot; dan menampilkan kartu stok.</li>
            </ul>
          </section>

          <section className="rounded-2xl border border-[#e6e9ed] bg-white p-5 md:p-6">
            <div className="flex items-center gap-2 text-sm font-bold">
              <ShieldCheck size={17} className="text-[#20897b]" /> Istilah stok
            </div>
            <div className="mt-3 grid gap-2 text-[11px] leading-5 text-[#69757e] sm:grid-cols-3">
              <p><b className="text-[#32916f]">Aman</b><br />Stok di atas batas minimum.</p>
              <p><b className="text-[#c5892b]">Menipis</b><br />Stok sama dengan atau di bawah minimum.</p>
              <p><b className="text-[#d97163]">Habis</b><br />Tidak ada stok tercatat di lokasi mana pun.</p>
            </div>
          </section>

          <section className="rounded-2xl border border-[#e6e9ed] bg-white p-5 md:p-6">
            <div className="flex items-center gap-2 text-sm font-bold">
              <Sparkles size={17} className="text-[#20897b]" /> Tanya Stok & Scan Nota
            </div>
            <p className="mt-2 text-[11px] leading-5 text-[#69757e]">
              Tanya Stok selalu punya pencarian cadangan berbasis kata kunci. Jawaban AI penuh aktif jika kunci
              Gemini sudah dipasang di server. Scan Nota juga membutuhkan kunci yang sama; kalau belum aktif,
              gunakan input pembelian manual dari hasil pembacaan nota.
            </p>
          </section>
        </div>

        <div className="grid gap-5">
          <section className="rounded-2xl border border-[#e6e9ed] bg-white p-5 md:p-6">
            <div className="flex items-center gap-2 text-sm font-bold">
              <FileSpreadsheet size={17} className="text-[#20897b]" /> Format import
            </div>
            <p className="mt-2 text-[11px] leading-5 text-[#69757e]">
              File CSV atau Excel (.xlsx) dengan kolom berikut:
            </p>
            <code className="mt-3 block overflow-x-auto rounded-lg bg-[#f6f8f9] p-3 text-[10px] leading-5 text-[#4d5962]">
              nama;sku;kategori;satuan;jumlah;harga_modal;lokasi_kode;stok_minimum
            </code>
            <button
              type="button"
              onClick={() => onNavigate("import")}
              className="mt-4 text-[11px] font-semibold text-[#1f8f80]"
            >
              Buka Import data <ArrowRight className="inline" size={13} />
            </button>
          </section>

          <section className="rounded-2xl border border-[#e6e9ed] bg-white p-5 md:p-6">
            <div className="flex items-center gap-2 text-sm font-bold">
              <Mail size={17} className="text-[#20897b]" /> OTP & email
            </div>
            <ul className="mt-3 space-y-2 text-[11px] leading-5 text-[#69757e]">
              <li>• Kode OTP berlaku 10 menit dan dikirim lewat Brevo dari alamat pengirim yang sudah diverifikasi.</li>
              <li>• Jika tidak masuk, cek folder Spam/Promotions, lalu gunakan tombol kirim ulang (jeda 60 detik).</li>
              <li>• Jangan bagikan kode OTP kepada siapa pun.</li>
            </ul>
          </section>

          <section className="rounded-2xl border border-[#e6e9ed] bg-white p-5 md:p-6">
            <div className="flex items-center gap-2 text-sm font-bold">
              <Camera size={17} className="text-[#20897b]" /> Tips foto nota
            </div>
            <ul className="mt-3 space-y-2 text-[11px] leading-5 text-[#69757e]">
              <li>• Pastikan seluruh nota masuk frame dan tidak buram.</li>
              <li>• Gunakan pencahayaan cukup, hindari bayangan tangan.</li>
              <li>• Ukuran maksimal 1,5 MB; kompres foto bila perlu.</li>
            </ul>
          </section>

          <section className="rounded-2xl border border-[#e6e9ed] bg-white p-5 md:p-6">
            <h3 className="text-sm font-bold">Butuh bantuan lain?</h3>
            <p className="mt-2 text-[11px] leading-5 text-[#69757e]">
              Hubungi pemilik workspace atau admin Wareflow. Sertakan nama barang, waktu kejadian, dan tangkapan
              layar jika ada error.
            </p>
          </section>
        </div>
      </div>
    </>
  );
}
