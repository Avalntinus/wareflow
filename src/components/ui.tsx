"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

export function Toast({
  kind,
  message,
  onClose,
}: {
  kind: "success" | "error";
  message: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const timer = window.setTimeout(onClose, kind === "error" ? 5200 : 3200);
    return () => window.clearTimeout(timer);
  }, [kind, message, onClose]);

  return (
    <div
      role="status"
      className={`fixed bottom-5 left-1/2 z-[70] flex max-w-[calc(100vw-2rem)] -translate-x-1/2 items-start gap-3 rounded-xl border px-4 py-3 text-xs font-semibold shadow-xl sm:left-auto sm:right-5 sm:translate-x-0 ${
        kind === "error"
          ? "border-[#f0c9c3] bg-[#fff5f3] text-[#b05245]"
          : "border-[#cce8e1] bg-[#effaf7] text-[#247e70]"
      }`}
    >
      <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-current" />
      <span className="leading-5">{message}</span>
      <button type="button" onClick={onClose} aria-label="Tutup notifikasi" className="ml-1 rounded p-0.5 opacity-60 hover:opacity-100">
        <X size={14} />
      </button>
    </div>
  );
}

export function Modal({
  title,
  description,
  onClose,
  children,
  width = "max-w-lg",
}: {
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
  width?: string;
}) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const dialog = (
    <div className="wd-overlay fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 backdrop-blur-sm sm:items-center">
      <button type="button" aria-label="Tutup dialog" onClick={onClose} className="absolute inset-0 cursor-default" />
      <div role="dialog" aria-modal="true" aria-label={title} className={`relative my-auto w-full ${width} rounded-2xl border border-[#e6e9ed] bg-white p-6 shadow-2xl`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold">{title}</h2>
            {description && <p className="mt-1 text-xs leading-5 text-[#8c969d]">{description}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label="Tutup" className="rounded-lg p-1 text-[#8e989f] hover:bg-[#f4f6f7]">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );

  // Portal keeps the dialog above the page even when it is opened from a
  // transformed container (e.g. a view with an entrance animation).
  return typeof document === "undefined" ? dialog : createPortal(dialog, document.body);
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e9f6f3] text-[#20897b]">{icon}</div>
      <h3 className="mt-4 text-sm font-bold">{title}</h3>
      <p className="mt-1 max-w-sm text-xs leading-5 text-[#89939c]">{description}</p>
      {actionLabel && onAction && (
        <button type="button" onClick={onAction} className="mt-5 rounded-xl bg-[#1f8f80] px-4 py-2.5 text-xs font-semibold text-white">
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      {label && <span>{label}</span>}
    </span>
  );
}

export function PageHeading({
  eyebrow,
  title,
  action,
}: {
  eyebrow: string;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="wd-view-head">
      <div>
        <p>{eyebrow}</p>
        <h1>{title}</h1>
      </div>
      {action}
    </div>
  );
}
