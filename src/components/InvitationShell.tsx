"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

interface Props {
  guestName: string;
  coupleNames: string;
  date: string;
  musicUrl: string;
  children: ReactNode;
}

export default function InvitationShell({ guestName, coupleNames, date, musicUrl, children }: Props) {
  const [opened, setOpened] = useState(false);
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

  const open = async () => {
    setOpened(true);
    if (musicUrl && audioRef.current) {
      try {
        await audioRef.current.play();
        setPlaying(true);
      } catch {
        setPlaying(false);
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

      <div className={`cover ${opened ? "cover-hidden" : ""}`} aria-hidden={opened}>
        <div className="cover-glow" />
        <p className="text-xs uppercase tracking-[0.4em] text-gold-300 animate-fade-in-up">Undangan Pernikahan</p>
        <h2 className="mt-6 font-display text-5xl md:text-7xl text-gold-shimmer animate-fade-in-up animate-delay-200">
          {coupleNames}
        </h2>
        <p className="mt-4 font-display text-xl text-cream animate-fade-in-up animate-delay-300">{date}</p>
        <div className="mt-10 animate-fade-in-up animate-delay-400">
          <p className="text-sm text-green-100">Kepada Yth.</p>
          <p className="mt-2 font-display text-2xl text-cream">{guestName}</p>
        </div>
        <button id="open-invitation" type="button" onClick={open} className="btn-gold mt-10 animate-fade-in-up animate-delay-500">
          Buka Undangan
        </button>
      </div>

      <main className={opened ? "" : "invisible"}>{children}</main>

      {opened && musicUrl && (
        <button
          id="music-toggle"
          type="button"
          onClick={toggle}
          className={`fixed bottom-6 left-6 z-50 music-btn ${playing ? "playing" : ""}`}
          aria-label={playing ? "Jeda musik" : "Putar musik"}
        >
          <svg className="music-icon" width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
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
