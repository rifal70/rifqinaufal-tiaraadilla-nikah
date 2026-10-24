"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import PelaminanScene from "@/components/Pelaminan";

interface Props {
  guestName: string;
  coupleNames: string;
  date: string;
  musicUrl: string;
  envelopeMessage?: string;
  children: ReactNode;
}

export default function InvitationShell({
  guestName,
  coupleNames,
  date,
  musicUrl,
  envelopeMessage,
  children,
}: Props) {
  const [opened, setOpened] = useState(false);
  const [isLetterOpen, setIsLetterOpen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [showLoadingOverlay, setShowLoadingOverlay] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Monitor loading status of critical cover images in InvitationShell
  useEffect(() => {
    let isMounted = true;
    const criticalImages = [
      "/ornament_top.png",
      "/ornament_bottom.png",
      "/janur_left.png",
      "/janur_right.png",
      "/envelope.png",
      "/letter.png",
      "/seal-love.png",
      "/pelaminan/rumah_joglo.png",
    ];

    let completedCount = 0;
    const total = criticalImages.length;

    const onFinish = () => {
      completedCount++;
      if (completedCount >= total && isMounted) {
        setImagesLoaded(true);
        setTimeout(() => {
          if (isMounted) setShowLoadingOverlay(false);
        }, 700);
      }
    };

    criticalImages.forEach((src) => {
      const img = new Image();
      img.src = src;
      if (img.complete) {
        onFinish();
      } else {
        img.onload = onFinish;
        img.onerror = onFinish;
      }
    });

    // Fallback timer maksimal 3 detik agar tidak menghambat user bila jaringan lambat
    const timer = setTimeout(() => {
      if (isMounted) {
        setImagesLoaded(true);
        setTimeout(() => {
          if (isMounted) setShowLoadingOverlay(false);
        }, 700);
      }
    }, 3000);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, []);

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

      {/* Loading Screen Anggun saat gambar di InvitationShell masih dimuat */}
      {showLoadingOverlay && (
        <div
          className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-forest-950 transition-opacity duration-700 ease-out select-none ${imagesLoaded ? "opacity-0 pointer-events-none" : "opacity-100"
            }`}
          aria-hidden={imagesLoaded}
        >
          {/* Cincin Emas Berputar & Kilau Berlian */}
          <div className="relative flex items-center justify-center">
            {/* Cincin luar berdenyut halus */}
            <div className="absolute h-20 w-20 sm:h-24 sm:w-24 rounded-full border border-gold-400/25 animate-ping opacity-30" />

            {/* Cincin spinner gradasi emas */}
            <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-full border-[2.5px] border-gold-500/20 border-t-gold-400 border-r-amber-200 animate-spin" />

            {/* Diamond emas di tengah */}
            <div className="absolute h-3.5 w-3.5 sm:h-4 sm:w-4 bg-gradient-to-tr from-gold-500 via-amber-200 to-yellow-100 rotate-45 shadow-[0_0_15px_rgba(212,175,55,0.9)] animate-pulse" />
          </div>

          {/* Label Tipografi Anggun */}
          <div className="mt-6 flex flex-col items-center gap-1.5">
            <p className="font-display text-xs sm:text-sm tracking-[0.35em] uppercase text-gold-shimmer">
              Memuat Undangan
            </p>
            <div className="flex gap-1.5 mt-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-gold-400/70 animate-bounce [animation-delay:-0.3s]" />
              <span className="h-1.5 w-1.5 rounded-full bg-gold-400/70 animate-bounce [animation-delay:-0.15s]" />
              <span className="h-1.5 w-1.5 rounded-full bg-gold-400/70 animate-bounce" />
            </div>
          </div>
        </div>
      )}

      {/* Container Cover */}
      <div
        className={`cover fixed inset-0 z-50 h-dvh min-h-dvh w-full overflow-hidden flex flex-col items-center justify-end landscape:block pb-0 ${opened
          ? "cover-hidden pointer-events-none opacity-0 transition-opacity duration-700"
          : ""
          }`}
        aria-hidden={opened}
      >
        {/* Ornamen Pojok Kanan Atas */}
        <img
          src="/ornament_top.png"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute top-0 right-0 z-10 w-44 xs:w-32 sm:w-48 md:w-72 lg:w-96 xl:w-[420px] landscape:w-20 landscape:sm:w-28 landscape:md:w-56 landscape:lg:w-80 select-none opacity-90 transition-all duration-1000 animate-fade-in"
        />

        {/* Ornamen Pojok Kiri Bawah */}
        <img
          src="/ornament_bottom.png"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 left-0 z-10 w-44 xs:w-32 sm:w-48 md:w-72 lg:w-96 xl:w-[420px] landscape:w-20 landscape:sm:w-28 landscape:md:w-56 landscape:lg:w-80 select-none opacity-90 transition-all duration-1000 animate-fade-in"
        />

        {/* Janur Kiri */}
        <img
          src="/janur_left.png"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute -left-12 xs:-left-16 sm:-left-24 md:-left-28 lg:-left-36 xl:-left-44 top-1/2 -translate-y-1/2 z-20 w-36 xs:w-44 sm:w-56 md:w-80 lg:w-[420px] xl:w-[500px] landscape:w-24 landscape:-left-10 landscape:sm:w-32 landscape:sm:-left-14 landscape:md:w-64 landscape:md:-left-24 landscape:lg:w-96 landscape:lg:-left-32 select-none opacity-80 sm:opacity-90 -rotate-[6deg] origin-bottom-left animate-janur-left transition-all"
        />

        {/* Janur Kanan */}
        <img
          src="/janur_right.png"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute -right-12 xs:-right-16 sm:-right-24 md:-right-28 lg:-right-36 xl:-right-44 top-1/2 -translate-y-1/2 z-20 w-36 xs:w-44 sm:w-56 md:w-80 lg:w-[420px] xl:w-[500px] landscape:w-24 landscape:-right-10 landscape:sm:w-32 landscape:sm:-right-14 landscape:md:w-64 landscape:md:-right-24 landscape:lg:w-96 landscape:lg:-right-32 select-none opacity-80 sm:opacity-90 rotate-[6deg] origin-bottom-right animate-janur-right transition-all"
        />

        {/* Area Amplop & Tombol */}
        <div className="relative z-30 flex flex-col items-center justify-center max-w-full mb-1 sm:mb-2 landscape:absolute landscape:top-[42%] landscape:left-1/2 landscape:bottom-auto landscape:-translate-x-1/2 landscape:-translate-y-1/2 landscape:mb-0">
          {/* Dimensi Amplop: Naik bertahap sampai desktop/layar lebar */}
          <div className="relative aspect-[4/3] w-[min(78vw,270px)] sm:w-[320px] md:w-[380px] lg:w-[430px] landscape:w-auto landscape:h-[34dvh] landscape:max-h-[145px] sm:landscape:h-[38dvh] sm:landscape:max-h-[165px] md:landscape:h-[42dvh] md:landscape:max-h-[235px] lg:landscape:h-[46dvh] lg:landscape:max-h-[265px] transition-all">

            {/* Layer 1: Amplop Dasar */}
            <img
              src="/envelope.png"
              alt="Amplop"
              className="absolute inset-0 h-full w-full object-contain drop-shadow-[0_12px_25px_rgba(0,0,0,0.45)]"
            />

            {/* Layer 2: Kertas Surat */}
            <div
              className={`absolute left-[11%] top-[3%] z-20 flex h-[88%] w-[78%] @container flex-col items-center justify-between p-2 sm:p-3 md:p-4 landscape:p-1 md:landscape:p-2 text-center transition-all duration-700 ease-out ${isLetterOpen
                ? "-translate-y-[48%] sm:-translate-y-[52%] md:-translate-y-[56%] landscape:-translate-y-[45%] sm:landscape:-translate-y-[48%] md:landscape:-translate-y-[52%] scale-[1.01] shadow-2xl"
                : "translate-y-0"
                }`}
            >
              <img
                src="/letter.png"
                alt="Surat"
                className="absolute inset-0 h-full w-full rounded-sm object-cover shadow-md"
              />

              <div className="relative z-10 flex h-full w-full flex-col items-center justify-center px-[12%] pt-[3%] pb-[7%] text-center">
                {/* Label Yth - Ukuran proporsional di semua layar */}
                <p className="animate-fade-in-up font-normal text-[#8c656d] leading-none text-[10px] xs:text-[11px] sm:text-xs md:text-[13px] landscape:text-[8px] sm:landscape:text-[8.5px] md:landscape:text-[11px]">
                  Kepada Yth.
                </p>

                {/* Nama Tamu - Tegas & elegan */}
                <p className="animate-fade-in-up animate-delay-200 mt-1 sm:mt-1.5 landscape:mt-0.5 md:landscape:mt-1 font-display font-bold tracking-wide text-[#3e2b2f] line-clamp-1 leading-snug text-[13px] xs:text-[14px] sm:text-[16px] md:text-[18px] landscape:text-[10px] sm:landscape:text-[11px] md:landscape:text-[15px]">
                  {guestName}
                </p>

                {/* Garis Pemisah Tipis */}
                <div className="my-1 sm:my-1.5 landscape:my-0.5 md:landscape:my-1 h-[1px] w-[22%] max-w-[38px] min-w-[16px] bg-[#7d535b]/25" />

                {/* Pesan Kehadiran - Tanpa line-clamp (teks utuh bebas terpotong) dengan skala teks optimal */}
                <p className="animate-fade-in-up animate-delay-400 font-display italic text-[#6d454d] leading-snug tracking-normal text-[10px] xs:text-[10.5px] sm:text-[11.5px] md:text-[12.5px] landscape:text-[8px] sm:landscape:text-[8.5px] md:landscape:text-[10.5px] lg:landscape:text-[11.5px] max-w-[92%]">
                  {envelopeMessage?.trim() || "Hi, kami tunggu kedatangan dan doa restunya ya. Jangan lupa datang dan ramaikan acara kami."}
                </p>
              </div>
            </div>

            {/* Layer 3: Saku Depan Amplop */}
            <img
              src="/envelope.png"
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-30 h-full w-full object-contain"
              style={{
                clipPath: "polygon(0% 34%, 50% 58%, 100% 34%, 100% 100%, 0% 100%)",
              }}
            />

            {/* Layer 4: Segel Hati */}
            <img
              src="/seal-love.png"
              alt="Segel Hati"
              aria-hidden="true"
              className="pointer-events-none absolute left-1/2 top-[58%] z-40 -translate-x-1/2 -translate-y-2 w-[14%] sm:w-[15%] object-contain drop-shadow-md"
            />
          </div>

          {/* Tombol Buka Undangan */}
          <button
            id="open-invitation"
            type="button"
            onClick={handleButtonClick}
            disabled={!imagesLoaded}
            className={`btn-gold relative z-40 mt-1.5 sm:mt-2.5 landscape:mt-1 md:landscape:mt-2.5 px-5 py-1.5 sm:px-6 sm:py-2 md:px-7 md:py-2.5 landscape:px-3 landscape:py-0.5 md:landscape:px-6 md:landscape:py-2 text-xs sm:text-sm md:text-base landscape:text-[9px] md:landscape:text-xs transition-all duration-300 shadow-md ${!imagesLoaded
              ? "opacity-70 cursor-not-allowed scale-100"
              : "hover:scale-105 active:scale-95"
              }`}
          >
            {!imagesLoaded ? (
              <span className="inline-flex items-center gap-2">
                <svg
                  className="animate-spin h-3.5 w-3.5 text-forest-950"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  />
                </svg>
                <span>Memuat...</span>
              </span>
            ) : isLetterOpen ? (
              "Masuk"
            ) : (
              "Buka Undangan"
            )}
          </button>
        </div>

        {/* Pelaminan: Terkunci di Tepi Paling Bawah Layar */}
        <div className="relative z-20 flex justify-center w-full max-h-[35vh] landscape:absolute landscape:bottom-0 landscape:left-0 landscape:right-0 landscape:max-h-[22dvh] shrink-0">
          <PelaminanScene />
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