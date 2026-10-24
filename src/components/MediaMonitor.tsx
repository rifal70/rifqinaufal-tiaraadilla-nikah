"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export default function MediaMonitor() {
  const [hasError, setHasError] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [failedCount, setFailedCount] = useState(0);

  useEffect(() => {
    setMounted(true);

    // Cek query parameter opsional untuk kemudahan testing di browser: ?error=media atau ?test=media-error atau ?test=broken-image
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (
        params.get("error") === "media" ||
        params.get("test") === "media-error" ||
        params.get("test") === "broken-image"
      ) {
        setHasError(true);
        setFailedCount(1);
      }
    }

    // 1. Tangani transisi halus untuk foto media (lewati ornamen motif/awan/pelaminan agar warna filter tidak tertimpa)
    const processImage = (img: HTMLImageElement) => {
      if (
        img.classList.contains("motive-ornament") ||
        img.classList.contains("cloud-float-top") ||
        img.classList.contains("cloud-float-bottom") ||
        img.src.includes("/motive/") ||
        img.src.includes("/pelaminan/") ||
        img.getAttribute("aria-hidden") === "true"
      ) {
        return;
      }

      // Jika gambar sudah selesai di-load (misal dari cache browser)
      if (img.complete && img.naturalWidth > 0) {
        img.classList.add("media-loaded");
        img.classList.remove("media-loading");
        return;
      }

      // Jika masih dalam proses unduh, tambahkan class loading
      if (!img.classList.contains("media-loaded")) {
        img.classList.add("media-loading");

        const handleLoad = () => {
          img.classList.remove("media-loading");
          img.classList.add("media-loaded");
          img.removeEventListener("load", handleLoad);
        };

        img.addEventListener("load", handleLoad, { once: true });
      }
    };

    // Jalankan pada semua gambar yang sudah ada di DOM
    document.querySelectorAll("img").forEach((el) => {
      if (el instanceof HTMLImageElement) {
        processImage(el);
      }
    });

    // Amati jika ada gambar baru yang ditambahkan ke DOM (misal gallery slide / modal)
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        m.addedNodes.forEach((node) => {
          if (node instanceof HTMLImageElement) {
            processImage(node);
          } else if (node instanceof HTMLElement) {
            node.querySelectorAll("img").forEach(processImage);
          }
        });
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // 2. Global Capture Listener untuk mendeteksi gambar yang GAGAL dimuat (Network / Offline error)
    const handleCaptureError = (event: ErrorEvent | Event) => {
      const target = event.target;
      if (target instanceof HTMLImageElement) {
        console.warn("Media failed to load:", target.src);
        setFailedCount((prev) => prev + 1);
        setHasError(true);
      }
    };

    // Gunakan capture phase (true) karena error pada elemen <img> tidak melakukan bubble
    window.addEventListener("error", handleCaptureError, true);

    return () => {
      observer.disconnect();
      window.removeEventListener("error", handleCaptureError, true);
    };
  }, []);

  const handleReload = () => {
    // Hapus parameter ?error=media jika ada saat reload
    if (window.location.search.includes("error=media")) {
      window.location.replace(window.location.pathname);
    } else {
      window.location.reload();
    }
  };

  if (!mounted || !hasError) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md select-none animate-fade-in"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="connection-error-title"
    >
      {/* Box Dialog Pop-up */}
      <div className="relative mx-auto flex w-full max-w-sm flex-col items-center rounded-2xl border border-gold-400/40 bg-gradient-to-b from-green-950/95 to-green-900/95 p-6 sm:p-7 text-center text-cream shadow-2xl backdrop-blur-md">
        {/* Ikon Peringatan / Sinyal */}
        <div className="mb-4 flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full border border-gold-400/50 bg-gold-400/10 shadow-[0_0_20px_rgba(212,175,55,0.2)]">
          <svg
            className="h-7 w-7 sm:h-8 sm:w-8 text-gold-300"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M1 1l22 22" />
            <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
            <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
            <path d="M10.71 5.05A16 16 0 0 1 22.58 9" />
            <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
            <line x1="12" y1="20" x2="12.01" y2="20" />
          </svg>
        </div>

        {/* Subtitle */}
        <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-gold-300">
          Koneksi Bermasalah
        </p>

        {/* Judul Utama */}
        <h2
          id="connection-error-title"
          className="mt-1.5 font-display text-xl sm:text-2xl font-bold text-gold-shimmer leading-tight"
        >
          Gagal Memuat Media
        </h2>

        {/* Garis Pemisah Berlian */}
        <div className="ornament-divider my-2.5 sm:my-3" aria-hidden="true">
          <span className="ornament-diamond" />
        </div>

        {/* Pesan Penjelasan */}
        <p className="text-xs sm:text-sm text-green-100/85 leading-relaxed">
          Beberapa foto atau media undangan tidak dapat dimuat karena gangguan koneksi internet.
          Silakan muat ulang halaman untuk mencoba kembali.
        </p>

        {/* Tombol Aksi */}
        <div className="mt-6 flex w-full flex-col gap-2">
          <button
            type="button"
            onClick={handleReload}
            className="btn-gold w-full py-2.5 text-xs sm:text-sm font-semibold tracking-wide transition-transform hover:scale-[1.02] active:scale-[0.98] shadow-md cursor-pointer"
          >
            Muat Ulang Halaman
          </button>

          <button
            type="button"
            onClick={() => setHasError(false)}
            className="w-full py-1.5 text-xs text-gold-300/70 hover:text-gold-200 transition-colors"
          >
            Tutup &amp; Lanjutkan Membaca
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
