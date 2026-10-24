"use client";

import { useState, useRef, useEffect } from "react";
import type { BankAccount } from "@/lib/content";
import BankCard from "@/components/BankCard";

interface DigitalGiftProps {
  accounts: BankAccount[];
  greeting?: string;
}

export default function DigitalGift({ accounts, greeting }: DigitalGiftProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isTopLoaded, setIsTopLoaded] = useState(false);
  const [isBottomLoaded, setIsBottomLoaded] = useState(false);
  const topImgRef = useRef<HTMLImageElement | null>(null);
  const bottomImgRef = useRef<HTMLImageElement | null>(null);

  const checkTopLoaded = (node: HTMLImageElement | null) => {
    topImgRef.current = node;
    if (node && node.complete) {
      setIsTopLoaded(true);
    }
  };

  const checkBottomLoaded = (node: HTMLImageElement | null) => {
    bottomImgRef.current = node;
    if (node && node.complete) {
      setIsBottomLoaded(true);
    }
  };

  useEffect(() => {
    const top = topImgRef.current;
    if (top) {
      if (top.complete) {
        setIsTopLoaded(true);
      } else {
        if ("decode" in top) {
          top.decode().then(() => setIsTopLoaded(true)).catch(() => setIsTopLoaded(true));
        }
        const done = () => setIsTopLoaded(true);
        top.addEventListener("load", done, { once: true });
        top.addEventListener("error", done, { once: true });
      }
    }
    const bottom = bottomImgRef.current;
    if (bottom) {
      if (bottom.complete) {
        setIsBottomLoaded(true);
      } else {
        if ("decode" in bottom) {
          bottom.decode().then(() => setIsBottomLoaded(true)).catch(() => setIsBottomLoaded(true));
        }
        const done = () => setIsBottomLoaded(true);
        bottom.addEventListener("load", done, { once: true });
        bottom.addEventListener("error", done, { once: true });
      }
    }
  }, []);

  const toggleOpen = () => {
    setIsOpen((prev) => !prev);
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center">
      {/* Pengantar / Ucapan */}
      {greeting ? (
        <p
          className="font-display text-base sm:text-lg md:text-xl text-cream/90 max-w-2xl mx-auto mb-8 sm:mb-12 md:mb-14 px-4 sm:px-6 leading-relaxed whitespace-pre-line text-center"
          data-reveal
        >
          {greeting}
        </p>
      ) : (
        <div className="mb-8 sm:mb-12 md:mb-14 max-w-2xl mx-auto px-4 w-full space-y-2.5 py-2 animate-pulse" data-reveal>
          <div className="h-3.5 sm:h-4 skeleton-shimmer rounded-full w-[85%] mx-auto" />
          <div className="h-3.5 sm:h-4 skeleton-shimmer rounded-full w-[60%] mx-auto" />
        </div>
      )}

      {/* Area Kado Interaktif */}
      <div className="relative w-full flex flex-col items-center pt-2 sm:pt-4 md:pt-6" data-reveal>
        {/* 1. KADO BAGIAN ATAS (TUTUP KADO) */}
        <div
          onClick={toggleOpen}
          role="button"
          tabIndex={0}
          aria-expanded={isOpen}
          aria-label={isOpen ? "Tutup kado" : "Buka kado digital"}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              toggleOpen();
            }
          }}
          className={`relative z-20 cursor-pointer select-none w-48 sm:w-60 md:w-68 flex items-center justify-center will-change-transform transform-gpu transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${isOpen
              ? "-translate-y-1 sm:-translate-y-2 -rotate-3 scale-[1.01] -mb-2 sm:-mb-3"
              : "translate-y-0 rotate-0 scale-100 hover:scale-[1.02] -mb-6 sm:-mb-8 md:-mb-9"
            }`}
        >
          {/* Sparkles dekoratif saat kado terbuka */}
          {isOpen && (
            <div className="absolute inset-0 pointer-events-none overflow-visible">
              <span className="absolute -top-1.5 left-[12%] text-gold-300 text-base sm:text-lg select-none animate-bounce">
                ✨
              </span>
              <span className="absolute -top-2.5 right-[18%] text-gold-200 text-lg sm:text-xl select-none">
                ✦
              </span>
              <span className="absolute 0 left-[50%] -translate-x-1/2 text-gold-400 text-xl sm:text-2xl select-none">
                ✧
              </span>
            </div>
          )}

          {/* Shimmer skeleton saat tutup kado belum termuat */}
          {!isTopLoaded && (
            <div
              aria-hidden="true"
              className="w-[85%] aspect-[16/7] skeleton-shimmer rounded-2xl mb-2"
            />
          )}

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={checkTopLoaded}
            src="/kado_top.png"
            alt="Tutup Kado"
            loading="lazy"
            decoding="async"
            onLoad={() => setIsTopLoaded(true)}
            onError={() => setIsTopLoaded(true)}
            className={`w-[85%] h-auto object-contain select-none pointer-events-none drop-shadow-[0_12px_22px_rgba(0,0,0,0.5)] transition-opacity duration-300 ${isTopLoaded ? "opacity-100" : "opacity-0 absolute"
              }`}
          />
        </div>

        {/* 2. SECTION PILIHAN REKENING (DI ANTARA KADO) - Menggunakan CSS Grid Transition Mulus Tanpa Reflow */}
        <div
          className={`grid w-full z-10 transition-[grid-template-rows,opacity] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${isOpen
              ? "grid-rows-[1fr] opacity-100 mt-0 mb-4"
              : "grid-rows-[0fr] opacity-0 my-0 pointer-events-none"
            }`}
        >
          <div className="overflow-hidden min-h-0 w-full flex flex-col items-center">
            {/* Header Rekening */}
            <div className="text-center px-4 mb-5 pt-1 sm:pt-1.5">
              <p className="text-xs sm:text-sm uppercase tracking-[0.22em] text-gold-300 font-semibold drop-shadow-sm">
                Tersedia Pilihan Rekening / Dompet Digital
              </p>
              <div className="mx-auto mt-2 h-[1px] w-24 bg-gradient-to-r from-transparent via-gold-400/50 to-transparent" />
            </div>

            {/* Kartu-kartu Rekening */}
            <div className="mx-auto flex flex-wrap justify-center gap-5 max-w-5xl w-full px-4 pb-4">
              {accounts.map((b) => (
                <div key={b.id} className="w-full sm:w-80">
                  <BankCard account={b} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 3. KADO BAGIAN BAWAH (KOTAK KADO) */}
        <div
          onClick={toggleOpen}
          role="button"
          tabIndex={0}
          aria-expanded={isOpen}
          aria-label={isOpen ? "Tutup kado" : "Buka kado digital"}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              toggleOpen();
            }
          }}
          className={`relative z-10 cursor-pointer select-none flex items-center justify-center will-change-transform transform-gpu transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${isOpen
              ? "w-60 sm:w-72 md:w-80 mt-3 sm:mt-4 scale-100"
              : "w-60 sm:w-72 md:w-80 mt-0 hover:scale-[1.02]"
            }`}
        >
          {/* Cahaya Emas / Glow yang memancar dari dalam kotak kado saat terbuka */}
          <div
            className={`absolute left-[26%] top-[14%] w-[48%] h-[26%] rounded-full bg-gradient-to-t from-gold-400 via-amber-300 to-yellow-100 blur-lg pointer-events-none transition-opacity duration-500 ease-out ${isOpen ? "opacity-80" : "opacity-0"
              }`}
          />

          {/* Shimmer skeleton saat kotak kado belum termuat */}
          {!isBottomLoaded && (
            <div
              aria-hidden="true"
              className="w-full aspect-[4/3] skeleton-shimmer rounded-3xl"
            />
          )}

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={checkBottomLoaded}
            src="/kado_bottom.png"
            alt="Kotak Kado"
            loading="lazy"
            decoding="async"
            onLoad={() => setIsBottomLoaded(true)}
            onError={() => setIsBottomLoaded(true)}
            className={`w-full h-auto object-contain select-none pointer-events-none drop-shadow-[0_16px_28px_rgba(0,0,0,0.5)] transition-opacity duration-300 ${isBottomLoaded ? "opacity-100" : "opacity-0 absolute"
              }`}
          />
        </div>

        {/* Petunjuk / Tooltip halus */}
        <p className="mt-3 text-xs text-green-200/70 tracking-wider select-none">
          {isOpen ? "Ketuk kotak atau tombol untuk menutup" : "Ketuk kotak atau tombol untuk membuka"}
        </p>

        {/* Tombol Buka / Tutup Kado */}
        <button
          type="button"
          id="btn-toggle-kado"
          onClick={toggleOpen}
          className={`mt-4 inline-flex items-center gap-2.5 px-8 py-3 rounded-full font-semibold tracking-wider uppercase transition-all duration-300 active:scale-95 shadow-md ${isOpen
            ? "bg-white/10 hover:bg-white/20 text-cream border border-gold-400/30 text-xs sm:text-sm hover:scale-105"
            : "btn-gold text-xs sm:text-sm hover:scale-105 shadow-gold-500/20"
            }`}
        >
          <span>{isOpen ? "✕" : "🎁"}</span>
          <span>{isOpen ? "Tutup Kado" : "Buka Kado Digital"}</span>
        </button>
      </div>
    </div>
  );
}
