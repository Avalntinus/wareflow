"use client";

import { ArrowUpRight, Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AiCard } from "@/lib/ui";

type Message = {
  id: string;
  role: "user" | "assistant";
  text: string;
  cards?: AiCard[];
  fallback?: boolean;
  error?: boolean;
};

const suggestions = ["Kabel HDMI ada di mana?", "Stok lampu", "Barang di gudang"];

export function AiPanel({ onClose }: { onClose: () => void }) {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "greeting",
      role: "assistant",
      text: "Halo 👋 Saya bisa membantu menemukan lokasi dan jumlah stok barang. Tanyakan dengan nama barang, SKU, kategori, atau lokasi.",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  async function ask(value: string) {
    const text = value.trim();
    if (!text || loading) return;
    setQuestion("");
    setMessages((current) => [...current, { id: crypto.randomUUID(), role: "user", text }]);
    setLoading(true);
    try {
      const response = await fetch("/api/ai/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: text }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        setMessages((current) => [
          ...current,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            text: body?.error ?? "Pertanyaan gagal diproses. Coba lagi.",
            error: true,
          },
        ]);
        return;
      }
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: body.answer,
          cards: Array.isArray(body.cards) ? body.cards : [],
          fallback: Boolean(body.fallback),
        },
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: "Koneksi bermasalah. Periksa jaringan lalu coba lagi.",
          error: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="wd-overlay fixed inset-0 z-50 flex justify-end backdrop-blur-[2px]">
      <button type="button" aria-label="Tutup Tanya Stok" onClick={onClose} className="flex-1 cursor-default" />
      <div role="dialog" aria-modal="true" aria-label="Tanya Stok" className="flex h-full w-full max-w-[440px] flex-col wd-sheet border-l border-[#e6e9ed] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#e8ebed] px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e4f5f1] text-[#208a7b]">
              <Sparkles size={17} />
            </div>
            <div>
              <h2 className="text-sm font-bold">Tanya Stok</h2>
              <p className="text-[10px] text-[#89939c]">Asisten pencarian Wareflow</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Tutup" className="rounded-lg p-1 text-[#8e989f] hover:bg-[#f4f6f7]">
            <X size={18} />
          </button>
        </div>

        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-5">
          {messages.map((message) =>
            message.role === "assistant" ? (
              <div key={message.id} className="flex gap-2">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#e4f5f1] text-[#208a7b]">
                  <Sparkles size={13} />
                </div>
                <div className="min-w-0 flex-1">
                  <div
                    className={`rounded-2xl rounded-tl-sm p-3 text-xs leading-5 ${
                      message.error ? "bg-[#fff5f3] text-[#a45b4f]" : "bg-[#f2faf8] text-[#466b64]"
                    }`}
                  >
                    {message.text}
                  </div>
                  {message.fallback && !message.error && (
                    <p className="mt-1.5 text-[9px] text-[#a0a8ae]">Mode pencarian kata kunci</p>
                  )}
                  {message.cards && message.cards.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {message.cards.map((card) => (
                        <div key={card.id} className="rounded-xl border border-[#d9ece8] bg-white p-3">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-xs font-semibold text-[#294c46]">{card.name}</p>
                            <span
                              className={`shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-bold ${
                                card.status === "Aman"
                                  ? "bg-[#e8f6f3] text-[#2c8e7a]"
                                  : card.status === "Menipis"
                                    ? "bg-[#fff5e3] text-[#c48624]"
                                    : "bg-[#fff0ee] text-[#d96f61]"
                              }`}
                            >
                              {card.status}
                            </span>
                          </div>
                          <p className="mt-1 text-[10px] text-[#6e8e88]">
                            {card.sku ? `${card.sku} · ` : ""}
                            {card.category} · Stok <b>{card.stock} {card.unit}</b>
                          </p>
                          <div className="mt-2 space-y-1">
                            {card.locations.length === 0 ? (
                              <p className="text-[10px] text-[#a0a8ae]">Belum ditempatkan di lokasi mana pun.</p>
                            ) : (
                              card.locations.map((location) => (
                                <p key={location.code} className="flex items-center justify-between text-[10px] text-[#5c7772]">
                                  <span>{location.name}</span>
                                  <b>{location.quantity} {card.unit}</b>
                                </p>
                              ))
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div key={message.id} className="ml-9 rounded-2xl rounded-tr-sm bg-[#f4f5f6] p-3 text-xs text-[#4d5962]">
                {message.text}
              </div>
            ),
          )}
          {loading && (
            <div className="flex gap-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#e4f5f1] text-[#208a7b]">
                <Sparkles size={13} />
              </div>
              <div className="flex items-center gap-2 rounded-2xl rounded-tl-sm bg-[#f2faf8] px-3 py-2 text-xs text-[#6e8e88]">
                <span className="h-2 w-2 animate-pulse rounded-full bg-[#7fc5b9]" />
                Mencari di data stok...
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-[#e8ebed] px-5 py-4">
          {messages.length <= 1 && (
            <div className="mb-3">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-[#a0a8ae]">Coba tanyakan</p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => ask(item)}
                    className="rounded-full border border-[#e0e8e6] px-3 py-2 text-[10px] text-[#5c7772] hover:bg-[#f2faf8]"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}
          <form
            onSubmit={(event) => {
              event.preventDefault();
              ask(question);
            }}
          >
            <div className="flex items-center gap-2 rounded-xl border border-[#dfe5e6] bg-white p-2 focus-within:border-[#78bdb2]">
              <input
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder="Tulis pertanyaan..."
                maxLength={300}
                className="min-w-0 flex-1 px-2 text-xs outline-none"
                aria-label="Pertanyaan Tanya Stok"
              />
              <button
                type="submit"
                disabled={!question.trim() || loading}
                aria-label="Kirim pertanyaan"
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1f8f80] text-white disabled:opacity-40"
              >
                <ArrowUpRight size={15} />
              </button>
            </div>
          </form>
          <p className="mt-2 text-center text-[9px] text-[#a2aab0]">
            AI membantu mencari. Periksa kembali informasi sebelum bertindak.
          </p>
        </div>
      </div>
    </div>
  );
}
