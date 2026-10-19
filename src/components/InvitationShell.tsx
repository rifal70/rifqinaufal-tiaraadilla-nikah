"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

interface Props {
  guestName: string;
  coupleNames: string;
  date: string;
  musicUrl: string;
  children: ReactNode;
}

export default function InvitationShell({
  guestName,
  coupleNames,
  date,
  musicUrl,
  children,
}: Props) {
  const [opened, setOpened] = useState(false);
  const [isLetterOpen, setIsLetterOpen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    document.body.style.overflow = opened ? "" : "hidden";
    if (!opened) return;
    const els = document.querySelectorAll<HTMLElement>("[data-reveal]");
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("revealed");
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.15 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [opened]);

  const handleButtonClick = async () => {
    if (!isLetterOpen) {
      setIsLetterOpen(true);
    } else {
      setOpened(true);
      if (musicUrl && audioRef.current) {
        try {
          await audioRef.current.play();
          setPlaying(true);
        } catch {
          setPlaying(false);
        }
      }
    }
  };

  const toggle = async () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) {
      try {
        await a.play();
        setPlaying(true);
      } catch {
        setPlaying(false);
      }
    } else {
      a.pause();
      setPlaying(false);
    }
  };

  return (
    <>
      {musicUrl && <audio ref={audioRef} src={musicUrl} loop preload="none" />}

      {/* Gunakan min-h-dvh dan overflow-y-auto agar tombol tidak terpotong di HP layar pendek / landscape */}
      <div
        className={`cover fixed inset-0 z-50 flex min-h-dvh w-full items-center justify-center overflow-x-hidden overflow-y-auto px-4 py-6 ${opened
          ? "cover-hidden pointer-events-none opacity-0 transition-opacity duration-700"
          : ""
          }`}
        aria-hidden={opened}
      >
        {/* Ornamen Pojok Kanan Atas */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/ornament_top.png"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute top-0 right-0 z-5 w-24 xs:w-36 sm:w-60 md:w-80 select-none opacity-90 transition-opacity duration-1000 animate-fade-in"
        />

        {/* Ornamen Pojok Kiri Bawah */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/ornament_bottom.png"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 left-0 z-5 w-24 xs:w-36 sm:w-60 md:w-80 select-none opacity-90 transition-opacity duration-1000 animate-fade-in"
        />

        {/* Janur Kiri */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/janur_left.png"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute -left-12 xs:-left-16 sm:-left-28 md:-left-36 top-1/2 -translate-y-1/2 z-10 w-36 xs:w-48 sm:w-64 md:w-80 select-none opacity-80 sm:opacity-90 -rotate-[6deg] origin-bottom-left animate-janur-left"
        />

        {/* Janur Kanan */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/janur_right.png"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute -right-12 xs:-right-16 sm:-right-28 md:-right-36 top-1/2 -translate-y-1/2 z-10 w-36 xs:w-48 sm:w-64 md:w-80 select-none opacity-80 sm:opacity-90 rotate-[6deg] origin-bottom-right animate-janur-right"
        />

        {/* Area Amplop & Surat - Tambahkan pt agar saat surat naik tidak terpotong tepi atas */}
        <div className="relative z-30 my-auto flex flex-col items-center justify-center max-w-full pt-12 sm:pt-16">
          {/* Dimensi amplop: fleksibel fluid scale (w-[min(88vw,420px)]) */}
          <div className="relative aspect-[4/3] w-[min(85vw,360px)] sm:w-[400px] md:w-[440px] transition-all">
            {/* Layer 1: Amplop Dasar */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/envelope.png"
              alt="Amplop"
              className="absolute inset-0 h-full w-full object-contain drop-shadow-[0_15px_30px_rgba(0,0,0,0.45)]"
            />

            {/* Layer 2: Kertas Surat */}
            <div
              className={`absolute left-[11%] top-[3%] z-20 flex h-[88%] w-[78%] flex-col items-center justify-between p-2.5 xs:p-3 sm:p-5 text-center transition-all duration-700 ease-out ${isLetterOpen
                ? "-translate-y-12 xs:-translate-y-16 sm:-translate-y-20 scale-[1.01] shadow-2xl"
                : "translate-y-0"
                }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/letter.png"
                alt="Surat"
                className="absolute inset-0 h-full w-full rounded-sm object-cover shadow-md"
              />

              <div className="relative z-10 flex h-full w-full flex-col items-center justify-center">
                <p className="animate-fade-in-up text-[7px] xs:text-[8px] sm:text-[10px] font-semibold uppercase tracking-[0.2em] text-[#7d535b]">
                  Undangan Pernikahan
                </p>

                <h2 className="animate-fade-in-up animate-delay-200 mt-0.5 xs:mt-1.5 font-display text-sm xs:text-base sm:text-xl md:text-2xl font-bold tracking-tight text-[#3e2b2f] leading-snug">
                  {coupleNames}
                </h2>

                <p className="animate-fade-in-up animate-delay-300 mt-0.5 font-display text-[9px] xs:text-[10px] sm:text-xs font-medium text-[#6c4850]">
                  {date}
                </p>

                <div className="my-1 xs:my-1.5 sm:my-2.5 h-[1px] w-6 xs:w-10 sm:w-14 bg-[#7d535b]/25" />

                <div className="animate-fade-in-up animate-delay-400">
                  <p className="text-[7px] xs:text-[8px] sm:text-[9px] font-normal text-[#8c656d]">
                    Kepada Yth.
                  </p>
                  <p className="mt-0.5 font-display text-[10px] xs:text-xs sm:text-sm font-bold tracking-wide text-[#3e2b2f] line-clamp-1">
                    {guestName}
                  </p>
                </div>
              </div>
            </div>

            {/* Layer 3: Saku Depan Amplop */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/envelope.png"
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-30 h-full w-full object-contain"
              style={{
                clipPath: "polygon(0 32%, 50% 61%, 100% 32%, 100% 100%, 0 100%)",
              }}
            />
          </div>

          {/* Tombol Interaktif */}
          <button
            id="open-invitation"
            type="button"
            onClick={handleButtonClick}
            className="btn-gold relative z-40 mt-4 xs:mt-6 sm:mt-8 px-5 py-2 xs:px-6 xs:py-2.5 text-xs sm:text-sm transition-transform duration-300 hover:scale-105 active:scale-95"
          >
            {isLetterOpen ? "Masuk" : "Buka Undangan"}
          </button>
        </div>
      </div>

      <main className={opened ? "" : "invisible"}>{children}</main>

      {opened && musicUrl && (
        <button
          id="music-toggle"
          type="button"
          onClick={toggle}
          className={`music-btn fixed bottom-4 left-4 sm:bottom-6 sm:left-6 z-50 p-2 sm:p-3 rounded-full bg-white/80 backdrop-blur shadow-md ${playing ? "playing" : ""
            }`}
          aria-label={playing ? "Jeda musik" : "Putar musik"}
        >
          <svg
            className="music-icon h-4 w-4 sm:h-5 sm:w-5"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden
          >
            {playing ? (
              <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" />
            ) : (
              <path d="M6 4l14 8-14 8V4z" />
            )}
          </svg>
        </button>
      )}
    </>
  );
}