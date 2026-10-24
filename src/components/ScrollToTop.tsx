"use client";

import { useEffect, useState } from "react";

interface ScrollToTopProps {
  targetId?: string;
}

export default function ScrollToTop({ targetId = "penutup" }: ScrollToTopProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // 1. Amati elemen target (section penutup) dengan IntersectionObserver
    const targetElement = document.getElementById(targetId);

    if (targetElement) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            // Tampilkan tombol ketika section penutup mulai terlihat di viewport
            setVisible(entry.isIntersecting);
          });
        },
        {
          root: null,
          threshold: 0.1, // Muncul saat 10% dari section penutup masuk viewport
        }
      );

      observer.observe(targetElement);

      return () => {
        observer.disconnect();
      };
    } else {
      // 2. Fallback: deteksi scroll mendekati dasar halaman jika targetId tidak ditemukan
      const handleScroll = () => {
        const scrollPosition = window.innerHeight + window.scrollY;
        const totalHeight = document.documentElement.scrollHeight;
        // Muncul jika posisi scroll berada dalam 500px dari dasar halaman
        setVisible(scrollPosition >= totalHeight - 500);
      };

      window.addEventListener("scroll", handleScroll, { passive: true });
      return () => {
        window.removeEventListener("scroll", handleScroll);
      };
    }
  }, [targetId]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <button
      id="scroll-to-top"
      type="button"
      onClick={scrollToTop}
      aria-label="Kembali ke atas"
      title="Kembali ke atas"
      className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex items-center justify-center h-11 w-11 sm:h-12 sm:w-12 rounded-full border border-gold-400/60 bg-forest-900/90 text-gold-300 backdrop-blur-md shadow-[0_6px_22px_rgba(0,0,0,0.6)] transition-all duration-500 ease-out hover:bg-gold-500 hover:text-forest-950 hover:border-gold-300 hover:scale-110 hover:shadow-[0_0_20px_rgba(212,175,55,0.6)] active:scale-95 ${
        visible
          ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
          : "opacity-0 translate-y-6 scale-90 pointer-events-none"
      }`}
    >
      <svg
        className="h-5 w-5 sm:h-6 sm:w-6 transition-transform duration-300 group-hover:-translate-y-0.5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M18 15l-6-6-6 6" />
      </svg>
    </button>
  );
}
