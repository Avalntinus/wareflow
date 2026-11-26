"use client";

import { AlertTriangle, CheckCircle2, ChevronRight, Download, FileSpreadsheet, Upload } from "lucide-react";
import { useState } from "react";
import { PageHeading, Spinner } from "@/components/ui";
type ImportResult = {
  totalRows: number;
  successRows: number;
  failedRows: number;
  errors: { row: number; reason: string }[];
};

export function ImportView({
  onImported,
  notify,
}: {
  onImported: () => Promise<void>;
  notify: (kind: "success" | "error", message: string) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);
  const [importing, setImporting] = useState(false);
  const [inputKey, setInputKey] = useState(0);

  function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setFileName(selected.name);
    setMessage("");
    setResult(null);
  }

  async function processImport() {
    if (!file) return;
    setImporting(true);
    setMessage("");
    const form = new FormData();
    form.append("file", file);
    const response = await fetch("/api/import", { method: "POST", body: form });
    const body = await response.json().catch(() => null);
    setImporting(false);
    if (!response.ok) {
      setMessage(body?.error ?? "Import gagal diproses.");
      return;
    }
    const summary: ImportResult = {
      totalRows: body.totalRows ?? 0,
      successRows: body.successRows ?? 0,
      failedRows: body.failedRows ?? 0,
      errors: Array.isArray(body.errors) ? body.errors : [],
    };
    setResult(summary);
    await onImported();
    notify(
      summary.failedRows > 0 ? "error" : "success",
      `${summary.successRows} baris berhasil diimport${summary.failedRows ? `, ${summary.failedRows} baris bermasalah` : ""}.`,
    );
  }

  function reset() {
    setFile(null);
    setFileName("");
    setMessage("");
    setResult(null);
    setInputKey((current) => current + 1);
  }

  function downloadTemplate() {
    const csv =
      "nama;sku;kategori;satuan;jumlah;harga_modal;lokasi_kode;stok_minimum\nLampu LED 12W;LMP-LED-12;Lampu;pcs;10;28000;RAK-2;5\n";
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "template-wareflow.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <PageHeading eyebrow="Masukkan banyak barang tanpa mengetik satu per satu" title="Import data" />

      <section className="mx-auto max-w-3xl rounded-2xl border border-[#e6e9ed] bg-white p-6 md:p-8">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#20897b]">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#dff2ee]">1</span> Unggah
          <ChevronRight size={14} />
          <span className={`flex h-7 w-7 items-center justify-center rounded-full ${file ? "bg-[#dff2ee]" : "bg-[#f0f3f4] text-[#8b959d]"}`}>2</span> Pratinjau
          <ChevronRight size={14} />
          <span className={`flex h-7 w-7 items-center justify-center rounded-full ${result ? "bg-[#dff2ee]" : "bg-[#f0f3f4] text-[#8b959d]"}`}>3</span> Simpan
        </div>

        <label className="mt-8 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#cfe6e1] bg-[#f5fbfa] px-6 py-12 text-center hover:bg-[#eef9f6]">
          <Upload className="text-[#2b9c8b]" size={28} />
          <p className="mt-4 text-sm font-bold">Pilih file Excel atau CSV</p>
          <p className="mt-2 text-[11px] text-[#8c999e]">Maksimal 5 MB · .xlsx, .csv</p>
          <input key={inputKey} type="file" accept=".xlsx,.csv" onChange={handleFile} className="hidden" />
        </label>

        {fileName && (
          <div className="mt-4 flex items-center gap-3 rounded-xl bg-[#f3f7f7] p-3 text-xs">
            <FileSpreadsheet size={17} className="text-[#20897b]" />
            <span className="flex-1 truncate">{fileName}</span>
            <button type="button" onClick={reset} className="text-[11px] font-semibold text-[#8b959d] hover:text-[#5f6c76]">
              Ganti file
            </button>
          </div>
        )}

        {message && <p className="mt-4 rounded-xl bg-[#fff0ee] p-3 text-xs text-[#c96c5e]">{message}</p>}

        {result && (
          <div className="mt-5 rounded-xl border border-[#e4efe9] bg-[#f7fbfa] p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#2b806f]">
              {result.failedRows > 0 ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
              {result.successRows} dari {result.totalRows} baris berhasil diimport
              {result.failedRows > 0 && `, ${result.failedRows} gagal`}.
            </div>
            {result.errors.length > 0 && (
              <div className="mt-3 max-h-48 overflow-y-auto rounded-lg border border-[#f0dedb] bg-white">
                <table className="w-full text-left text-[11px]">
                  <thead className="sticky top-0 bg-[#fff8f6] text-[#a9695f]">
                    <tr>
                      <th className="px-3 py-2 font-semibold">Baris</th>
                      <th className="px-3 py-2 font-semibold">Alasan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.errors.map((error, index) => (
                      <tr key={`${error.row}-${index}`} className="border-t border-[#f7ecea]">
                        <td className="px-3 py-2 text-[#8b6a64]">{error.row}</td>
                        <td className="px-3 py-2 text-[#8b6a64]">{error.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {!fileName && !result && (
          <div className="mt-6 rounded-xl border border-[#e9edf0] bg-[#f8fafb] p-4">
            <p className="text-[11px] font-semibold text-[#4d5962]">Kolom yang didukung</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {["nama", "sku", "kategori", "satuan", "jumlah", "harga_modal", "lokasi_kode", "stok_minimum"].map((column) => (
                <code key={column} className="rounded-md border border-[#e4e9ec] bg-white px-2 py-1 text-[10px] text-[#5f6c76]">
                  {column}
                </code>
              ))}
            </div>
            <p className="mt-3 text-[11px] leading-5 text-[#8a949d]">
              Baris dengan nama kosong atau kode lokasi yang tidak dikenal akan dilewati dan dilaporkan di bawah.
              Hanya kolom <b>nama</b> yang wajib diisi.
            </p>
          </div>
        )}

        <div className="mt-6 flex flex-wrap justify-between gap-3">
          <button
            type="button"
            onClick={downloadTemplate}
            className="flex items-center gap-2 rounded-xl border border-[#e1e7e8] px-4 py-3 text-xs font-semibold text-[#65717d]"
          >
            <Download size={15} /> Unduh template CSV
          </button>
          <button
            type="button"
            disabled={!file || importing}
            onClick={processImport}
            className="rounded-xl bg-[#1f8f80] px-4 py-3 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            {importing ? <Spinner label="Memproses..." /> : "Proses import"}
          </button>
        </div>
      </section>
    </>
  );
}
