"use client";

import { useState, useEffect } from "react";

type GalleryItem = {
  id: string;
  storage_path?: string;
  url?: string;
  signedUrl?: string;
};

export default function Gallery({ items }: { items: GalleryItem[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!items || items.length <= 1 || isOpen) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 4500);
    // 4,5 second

    return () => clearInterval(interval);
  }, [items, isOpen]);

  if (!items || items.length === 0) return null;

  return (
    <>
      <div className="relative mx-auto max-w-md md:max-w-lg p-2 sm:p-4">
        {/* ========================================================= */}
        {/* 1. CONTAINER UTAMA DENGAN FRAME-JAVA.PNG DI PALING LUAR  */}
        {/* ========================================================= */}
        <div
          onClick={() => setIsOpen(true)}
          className="group relative aspect-square w-full cursor-pointer select-none overflow-hidden rounded-[2.5rem] p-8 sm:p-11 shadow-[0_20px_50px_rgba(0,0,0,0.85)] transition-transform duration-300 hover:scale-[1.01]"
        >
          {/* Layer Gambar Frame Asli dari public/frame-java.png (Di Luar Kotak Foto) */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/frame-java.png"
            alt="Bingkai Jawa"
            className="pointer-events-none absolute inset-0 z-20 h-full w-full object-fill drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]"
          />

          {/* ========================================================= */}
          {/* 2. KOTAK DALAM (TEMPAT SLIDER FOTO BERADA)               */}
          {/* ========================================================= */}
          <div className="relative z-10 h-full w-full overflow-hidden rounded-2xl bg-black/60 shadow-[inset_0_0_25px_rgba(0,0,0,0.9)] border border-gold-500/20">
            <div
              className="flex h-full w-full transition-transform duration-700 ease-in-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {items.map((item, idx) => {
                const imgUrl = item.signedUrl || item.url || item.storage_path || "";
                return (
                  <div
                    key={item.id || idx}
                    className="relative flex h-full w-full flex-shrink-0 items-center justify-center p-3"
                  >
                    {/* Background Blur Halus */}
                    <div
                      className="absolute inset-0 bg-cover bg-center blur-md opacity-25"
                      style={{ backgroundImage: `url(${imgUrl})` }}
                    />

                    {/* Foto Utama */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imgUrl}
                      alt={`Foto galeri ${idx + 1}`}
                      className="relative max-h-full max-w-full rounded-lg object-contain shadow-md"
                      loading={idx === 0 ? "eager" : "lazy"}
                    />
                  </div>
                );
              })}
            </div>

            {/* Hover Hint */}
            <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center bg-black/35 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <span className="rounded-full border border-gold-400 bg-emerald-950/90 px-4 py-1.5 text-xs tracking-wider text-gold-300 shadow-xl backdrop-blur-sm">
                🔍 Klik untuk memperbesar
              </span>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 3. INDIKATOR TITIK (DOTS)                                 */}
        {/* ========================================================= */}
        {items.length > 1 && (
          <div className="mt-5 flex flex-col items-center gap-1.5">
            <div className="flex gap-2">
              {items.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-2 rounded-full transition-all duration-300 ${currentIndex === idx
                    ? "w-6 bg-gold-400 shadow-md"
                    : "w-2 bg-white/30 hover:bg-white/60"
                    }`}
                  aria-label={`Slide ${idx + 1}`}
                />
              ))}
            </div>
            <p className="text-[11px] text-gold-300/70 italic tracking-wider">
              Klik foto untuk memperbesar
            </p>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* 4. MODAL FULLSCREEN / LIGHTBOX                            */}
      {/* ========================================================= */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95 p-4 backdrop-blur-md"
          onClick={() => setIsOpen(false)}
        >
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-5 right-5 z-50 rounded-full bg-white/10 p-2.5 text-2xl text-white/80 transition-colors hover:bg-white/20 hover:text-white"
            aria-label="Tutup"
          >
            ✕
          </button>

          {items.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
              }}
              className="absolute left-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-2xl text-white hover:bg-white/20"
            >
              ‹
            </button>
          )}

          <div
            className="relative flex max-h-[85vh] max-w-full items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={items[currentIndex].signedUrl || items[currentIndex].url || items[currentIndex].storage_path || ""}
              alt={`Foto galeri ${currentIndex + 1}`}
              className="max-h-[82vh] max-w-full rounded-xl border border-gold-400/40 object-contain shadow-2xl"
            />
          </div>

          <div className="mt-4 text-xs tracking-widest text-gold-300">
            {currentIndex + 1} / {items.length}
          </div>

          {items.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
              }}
              className="absolute right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-2xl text-white hover:bg-white/20"
            >
              ›
            </button>
          )}
        </div>
      )}
    </>
  );
}