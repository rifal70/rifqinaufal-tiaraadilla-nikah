"use client";

import { useState } from "react";
import type { BankAccount } from "@/lib/content";
import BankCard from "@/components/BankCard";

interface DigitalGiftProps {
  accounts: BankAccount[];
  greeting?: string;
}

export default function DigitalGift({ accounts, greeting }: DigitalGiftProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOpen = () => {
    setIsOpen((prev) => !prev);
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center">
      {/* Pengantar / Ucapan */}
      {greeting ? (
        <p
          className="font-display text-lg md:text-xl text-cream/90 max-w-xl mx-auto mb-6 px-4 leading-relaxed whitespace-pre-line"
          data-reveal
        >
          {greeting}
        </p>
      ) : (
        <div className="mb-6 max-w-xl mx-auto px-4 w-full" data-reveal>
          <p className="placeholder-box text-center">[PLACEHOLDER — teks kado digital dari pemilik]</p>
        </div>
      )}

      {/* Area Kado Interaktif */}
      <div className="relative w-full flex flex-col items-center pt-2 sm:pt-4" data-reveal>
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
          className={`relative z-20 cursor-pointer select-none transition-all duration-700 ease-out flex items-center justify-center ${isOpen
            ? "w-44 sm:w-56 md:w-64 mb-4 sm:mb-6 -rotate-6 scale-105"
            : "w-44 sm:w-56 md:w-64 -mb-16 sm:-mb-20 md:-mb-24 rotate-0 scale-100 hover:scale-[1.03]"
            }`}
        >
          {/* Sparkles dekoratif saat kado terbuka */}
          {isOpen && (
            <div className="absolute inset-0 pointer-events-none overflow-visible">
              <span className="absolute -top-3 left-[10%] text-gold-300 text-lg sm:text-xl animate-bounce select-none">
                ✨
              </span>
              <span className="absolute -top-5 right-[15%] text-gold-200 text-xl sm:text-2xl animate-pulse select-none delay-150">
                ✦
              </span>
              <span className="absolute -top-1 left-[50%] -translate-x-1/2 text-gold-400 text-2xl sm:text-3xl animate-pulse select-none delay-300">
                ✧
              </span>
            </div>
          )}

          <img
            src="/kado_top.png"
            alt="Tutup Kado"
            loading="lazy"
            decoding="async"
            className={`w-[80%] h-auto object-contain transition-all duration-700 ${isOpen
              ? "drop-shadow-[0_20px_30px_rgba(0,0,0,0.6)]"
              : "-translate-y-10 rotate-0 scale-100 drop-shadow-[0_10px_16px_rgba(0,0,0,0.4)]"
              }`}
          />
        </div>

        {/* 2. SECTION PILIHAN REKENING (DI ANTARA KADO) */}
        <div
          className={`w-full z-10 transition-all duration-700 ease-in-out overflow-hidden flex flex-col items-center ${isOpen
            ? "max-h-[2000px] opacity-100 scale-100 my-4 py-2"
            : "max-h-0 opacity-0 scale-95 my-0 py-0 pointer-events-none"
            }`}
        >
          {/* Header Rekening */}
          <div className="text-center px-4 mb-6">
            <p className="text-xs sm:text-sm uppercase tracking-[0.22em] text-gold-300 font-semibold drop-shadow-sm">
              Tersedia Pilihan Rekening / Dompet Digital
            </p>
            <div className="mx-auto mt-2 h-[1px] w-24 bg-gradient-to-r from-transparent via-gold-400/50 to-transparent" />
          </div>

          {/* Kartu-kartu Rekening */}
          <div className="mx-auto flex flex-wrap justify-center gap-6 max-w-5xl w-full px-4">
            {accounts.map((b) => (
              <div key={b.id} className="w-full sm:w-80 animate-fade-in-up">
                <BankCard account={b} />
              </div>
            ))}
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
          className={`relative z-10 cursor-pointer select-none transition-all duration-700 ease-out flex items-center justify-center ${isOpen
            ? "w-60 sm:w-72 md:w-80 mt-2 sm:mt-4"
            : "w-60 sm:w-72 md:w-80 mt-0 hover:scale-[1.02]"
            }`}
        >
          {/* Cahaya Emas / Glow yang memancar dari dalam kotak kado saat terbuka */}
          <div
            className={`absolute left-[26%] top-[14%] w-[48%] h-[26%] rounded-full bg-gradient-to-t from-gold-400 via-amber-300 to-yellow-100 blur-lg pointer-events-none transition-all duration-700 ${isOpen ? "opacity-90 scale-125 animate-pulse" : "opacity-0 scale-50"
              }`}
          />

          <img
            src="/kado_bottom.png"
            alt="Kotak Kado"
            loading="lazy"
            decoding="async"
            className="w-full h-auto object-contain select-none pointer-events-none drop-shadow-[0_16px_30px_rgba(0,0,0,0.5)] transition-all duration-500"
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
