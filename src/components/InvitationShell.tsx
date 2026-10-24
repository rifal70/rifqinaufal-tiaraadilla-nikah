"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import PelaminanScene from "@/components/Pelaminan";

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
      {musicUrl && <audio ref={audioRef} src={musicUrl} loop preload="auto" />}

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
          <div className="relative aspect-[4/3] w-[min(78vw,270px)] sm:w-[320px] md:w-[380px] lg:w-[430px] landscape:w-auto landscape:h-[28dvh] landscape:max-h-[125px] md:landscape:h-[38dvh] md:landscape:max-h-[220px] lg:landscape:h-[44dvh] lg:landscape:max-h-[260px] transition-all">

            {/* Layer 1: Amplop Dasar */}
            <img
              src="/envelope.png"
              alt="Amplop"
              className="absolute inset-0 h-full w-full object-contain drop-shadow-[0_12px_25px_rgba(0,0,0,0.45)]"
            />

            {/* Layer 2: Kertas Surat */}
            <div
              className={`absolute left-[11%] top-[3%] z-20 flex h-[88%] w-[78%] @container flex-col items-center justify-between p-2 sm:p-3 md:p-4 landscape:p-1 md:landscape:p-2 text-center transition-all duration-700 ease-out ${isLetterOpen
                ? "-translate-y-[45%] sm:-translate-y-[52%] md:-translate-y-[58%] landscape:-translate-y-[26%] md:landscape:-translate-y-[45%] scale-[1.01] shadow-2xl"
                : "translate-y-0"
                }`}
            >
              <img
                src="/letter.png"
                alt="Surat"
                className="absolute inset-0 h-full w-full rounded-sm object-cover shadow-md"
              />

              <div className="relative z-10 flex h-full w-full flex-col items-center justify-center px-1">
                {/* Nama Pasangan */}
                <h2 className="animate-fade-in-up animate-delay-200 font-display font-bold tracking-tight text-[#3e2b2f] leading-tight text-[clamp(11px,4.2vw,22px)] landscape:text-[clamp(8px,2.4dvh,11px)] md:landscape:text-[clamp(13px,2.8vw,19px)]">
                  {coupleNames}
                </h2>

                {/* Garis Pemisah */}
                <div className="my-1 sm:my-1.5 md:my-2 landscape:my-0.5 md:landscape:my-1 h-[1px] w-[28%] max-w-[55px] min-w-[20px] bg-[#7d535b]/25" />

                <div className="animate-fade-in-up animate-delay-400 w-full">
                  {/* Label Yth */}
                  <p className="font-normal text-[#8c656d] leading-none text-[clamp(8.5px,2.6vw,13px)] landscape:text-[clamp(6.5px,1.9dvh,8.5px)] md:landscape:text-[clamp(9.5px,1.8vw,12px)]">
                    Kepada Yth.
                  </p>

                  {/* Nama Tamu */}
                  <p className="mt-0.5 font-display font-bold tracking-wide text-[#3e2b2f] line-clamp-1 text-[clamp(9.5px,3.2vw,16px)] landscape:text-[clamp(7.5px,2.2dvh,10px)] md:landscape:text-[clamp(11px,2.2vw,15px)]">
                    {guestName}
                  </p>
                </div>
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
            className="btn-gold relative z-40 mt-1.5 sm:mt-2.5 landscape:mt-1 md:landscape:mt-2.5 px-5 py-1.5 sm:px-6 sm:py-2 md:px-7 md:py-2.5 landscape:px-3 landscape:py-0.5 md:landscape:px-6 md:landscape:py-2 text-xs sm:text-sm md:text-base landscape:text-[9px] md:landscape:text-xs transition-transform duration-300 hover:scale-105 active:scale-95 shadow-md"
          >
            {isLetterOpen ? "Masuk" : "Buka Undangan"}
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