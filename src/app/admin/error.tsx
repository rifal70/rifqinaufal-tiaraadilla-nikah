"use client";

import { useEffect } from "react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin route error caught by boundary:", error);
  }, [error]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl border border-red-500/40 bg-[#0c1f17] p-6 text-cream shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-red-500/30 bg-red-950/60 text-red-400 shadow-inner">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-display text-xl text-gold-shimmer font-semibold">
              Terjadi Kesalahan
            </h2>
            <p className="mt-2 text-sm text-cream/90 leading-relaxed break-words">
              {error?.message || "Gagal memproses data di server."}
            </p>
            <p className="mt-1 text-xs text-cream/60">
              Silakan coba lagi tanpa harus memuat ulang seluruh halaman.
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-gold-500/15">
          <button
            type="button"
            onClick={() => {
              reset();
              window.location.reload();
            }}
            className="btn-gold text-xs px-5 py-2 font-medium"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    </div>
  );
}
