"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

type GalleryItem = {
  id: string;
  storage_path?: string;
  url?: string;
  signedUrl?: string;
};

function GallerySlide({
  item,
  idx,
  isPriority,
}: {
  item: GalleryItem;
  idx: number;
  isPriority: boolean;
}) {
  const [loaded, setLoaded] = useState(false);
  const imgUrl = item.signedUrl || item.url || item.storage_path || "";

  return (
    <div className="relative flex h-full w-full flex-shrink-0 items-center justify-center p-2">
      {/* Shimmer skeleton saat foto slide belum selesai dimuat */}
      <div
        aria-hidden="true"
        className={`absolute inset-0 skeleton-shimmer z-0 transition-opacity duration-500 ${
          loaded ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
      />

      {/* Background Blur Halus */}
      {loaded && (
        <div
          className="absolute inset-0 bg-cover bg-center blur-md opacity-25 transition-opacity duration-500"
          style={{ backgroundImage: `url(${imgUrl})` }}
        />
      )}

      {/* Foto Utama */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imgUrl}
        alt={`Foto galeri ${idx + 1}`}
        className={`relative max-h-full max-w-full rounded-md object-contain shadow-md transition-opacity duration-500 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
        loading={isPriority ? "eager" : "lazy"}
        decoding="async"
        onLoad={() => setLoaded(true)}
      />
    </div>
  );
}

function ModalGalleryImage({ src, alt }: { src: string; alt: string }) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
  }, [src]);

  return (
    <>
      {!loaded && (
        <div
          aria-hidden="true"
          className="absolute inset-0 skeleton-shimmer rounded-xl"
        />
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        decoding="async"
        onLoad={() => setLoaded(true)}
        className={`max-h-[82vh] max-w-full rounded-xl border border-gold-400/40 object-contain shadow-2xl transition-opacity duration-300 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
      />
    </>
  );
}

export default function Gallery({ items }: { items: GalleryItem[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!items || items.length <= 1 || isOpen) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 4500);

    return () => clearInterval(interval);
  }, [items, isOpen]);

  // Lock body scroll and handle keyboard navigation when modal is open
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    const originalOverscroll = document.body.style.overscrollBehavior;
    document.body.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "none";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      } else if (e.key === "ArrowLeft") {
        setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
      } else if (e.key === "ArrowRight") {
        setCurrentIndex((prev) => (prev + 1) % items.length);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.overscrollBehavior = originalOverscroll;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, items.length]);

  if (!items || items.length === 0) return null;

  return (
    <>
      <div className="relative mx-auto max-w-md md:max-w-lg p-2 sm:p-4">
        {/* ========================================================= */}
        {/* 1. CONTAINER UTAMA DENGAN FRAME-JAVA.PNG DI PALING LUAR  */}
        {/* ========================================================= */}
        <div
          onClick={() => setIsOpen(true)}
          className="group relative aspect-square w-full cursor-pointer select-none overflow-hidden rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.85)] transition-transform duration-300 hover:scale-[1.01]"
        >
          {/* ========================================================= */}
          {/* 2. KOTAK DALAM (TEMPAT SLIDER FOTO BERADA)               */}
          {/* Menggunakan inset persentase agar selalu pas di dalam frame */}
          {/* ========================================================= */}
          <div className="absolute inset-[13%] sm:inset-[12%] z-10 overflow-hidden rounded-xl bg-black/60 shadow-[inset_0_0_25px_rgba(0,0,0,0.9)] border border-gold-500/20">
            <div
              className="flex h-full w-full transition-transform duration-700 ease-in-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {items.map((item, idx) => (
                <GallerySlide
                  key={item.id || idx}
                  item={item}
                  idx={idx}
                  isPriority={idx === 0}
                />
              ))}
            </div>
          </div>

          {/* Layer Gambar Frame Asli (Berada di atas/z-20 menutupi pinggiran foto) */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/frame-java.png"
            alt="Bingkai Jawa"
            loading="lazy"
            decoding="async"
            className="pointer-events-none absolute inset-0 z-20 h-full w-full object-fill drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]"
          />
        </div>

        {/* ========================================================= */}
        {/* 3. INDIKATOR TITIK (DOTS)                                */}
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
      {/* 4. MODAL FULLSCREEN / LIGHTBOX (PORTAL KE BODY)           */}
      {/* ========================================================= */}
      {mounted && isOpen && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/95 p-4 backdrop-blur-md select-none touch-none overscroll-contain"
          onClick={() => setIsOpen(false)}
          onTouchStart={(e) => setTouchStartX(e.touches[0].clientX)}
          onTouchEnd={(e) => {
            if (touchStartX === null) return;
            const diff = touchStartX - e.changedTouches[0].clientX;
            const threshold = 40;
            if (diff > threshold) {
              setCurrentIndex((prev) => (prev + 1) % items.length);
            } else if (diff < -threshold) {
              setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
            }
            setTouchStartX(null);
          }}
          onWheel={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-5 right-5 z-[10000] rounded-full bg-white/10 p-2.5 text-2xl text-white/80 transition-colors hover:bg-white/20 hover:text-white"
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
              className="absolute left-4 z-[10000] flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-2xl text-white hover:bg-white/20"
            >
              ‹
            </button>
          )}

          <div
            className="relative flex max-h-[85vh] max-w-full min-w-[280px] min-h-[300px] items-center justify-center overflow-hidden rounded-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <ModalGalleryImage
              src={items[currentIndex].signedUrl || items[currentIndex].url || items[currentIndex].storage_path || ""}
              alt={`Foto galeri ${currentIndex + 1}`}
            />
          </div>

          <div className="mt-4 text-xs tracking-widest text-gold-300">
            {currentIndex + 1} / {items.length}
          </div>

          {items.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex((prev) => (prev + 1) % items.length);
              }}
              className="absolute right-4 z-[10000] flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-2xl text-white hover:bg-white/20"
            >
              ›
            </button>
          )}
        </div>,
        document.body
      )}
    </>
  );
}