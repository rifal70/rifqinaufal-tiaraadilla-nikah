"use client";

import React, { useEffect, useState } from "react";

interface WaitingScreenProps {
  countdownSeconds?: number;
  onRetry?: () => void;
  title?: string;
  subtitle?: string;
  message?: string;
}

export default function WaitingScreen({
  countdownSeconds = 6,
  onRetry,
  title = "Harap Tunggu Beberapa Saat",
  subtitle = "Undangan Sedang Ramai Diakses",
  message = "Saat ini undangan pernikahan kami sedang diakses oleh banyak tamu secara bersamaan. Mohon tunggu sebentar, halaman akan memuat ulang secara otomatis...",
}: WaitingScreenProps) {
  const [secondsLeft, setSecondsLeft] = useState(countdownSeconds);
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = () => {
    setIsRetrying(true);
    if (onRetry) {
      onRetry();
    } else {
      // Hilangkan query ?status=busy jika ada, lalu reload halaman bersih
      const cleanUrl = window.location.pathname;
      window.location.replace(cleanUrl);
    }
  };

  useEffect(() => {
    if (secondsLeft <= 0) {
      handleRetry();
      return;
    }

    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsLeft]);

  return (
    <main
      className="fixed inset-0 z-[9999] flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-green-900 via-green-800 to-green-950 px-4 py-8 text-center text-cream select-none"
      role="alert"
      aria-live="polite"
    >
      {/* Ornamen Pojok Kanan Atas */}
      <img
        src="/ornament_top.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute top-0 right-0 z-0 w-36 xs:w-44 sm:w-60 md:w-80 opacity-60 transition-opacity"
      />

      {/* Ornamen Pojok Kiri Bawah */}
      <img
        src="/ornament_bottom.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-0 z-0 w-36 xs:w-44 sm:w-60 md:w-80 opacity-60 transition-opacity"
      />

      {/* Kotak Card Utama Antrean */}
      <div className="relative z-10 mx-auto flex w-full max-w-md flex-col items-center rounded-2xl border border-gold-400/30 bg-black/40 p-6 sm:p-8 backdrop-blur-md shadow-2xl animate-fade-in">
        {/* Ikon Jam Pasir / Denyut Emas */}
        <div className="relative mb-4 flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full border border-gold-400/40 bg-gold-400/10 shadow-[0_0_20px_rgba(212,175,55,0.25)]">
          <span className="absolute inset-0 rounded-full border border-gold-300/40 animate-ping opacity-30" />
          <svg
            className="h-8 w-8 sm:h-10 sm:w-10 text-gold-300"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M5 22h14" />
            <path d="M5 2h14" />
            <path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22" />
            <path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2" />
          </svg>
        </div>

        {/* Subtitle */}
        <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.25em] text-gold-300">
          {subtitle}
        </p>

        {/* Judul Utama */}
        <h1 className="mt-2 font-display text-2xl sm:text-3xl md:text-4xl font-bold text-gold-shimmer leading-snug">
          {title}
        </h1>

        {/* Garis Pemisah Berlian */}
        <div className="ornament-divider my-3 sm:my-4" aria-hidden="true">
          <span className="ornament-diamond" />
        </div>

        {/* Deskripsi */}
        <p className="max-w-[320px] sm:max-w-sm text-xs sm:text-sm text-green-100/90 leading-relaxed">
          {message}
        </p>

        {/* Indikator Hitung Mundur */}
        <div className="mt-6 flex items-center justify-center gap-2 rounded-full border border-gold-400/20 bg-white/5 px-4 py-1.5 text-xs text-gold-200">
          <span className="inline-block h-2 w-2 rounded-full bg-gold-400 animate-pulse" />
          <span>
            {isRetrying
              ? "Sedang memuat ulang..."
              : `Memuat ulang otomatis dalam ${secondsLeft} detik`}
          </span>
        </div>

        {/* Tombol Muat Ulang Manual */}
        <button
          type="button"
          onClick={handleRetry}
          disabled={isRetrying}
          className="btn-gold mt-6 w-full max-w-[240px] px-6 py-2.5 text-xs sm:text-sm font-semibold tracking-wide transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 shadow-lg cursor-pointer"
        >
          {isRetrying ? "Memuat..." : "Coba Muat Ulang Sekarang"}
        </button>
      </div>

      {/* Footer Info */}
      <p className="relative z-10 mt-8 text-[11px] text-green-200/50">
        The Wedding of Rifqi &amp; Tiara
      </p>
    </main>
  );
}
