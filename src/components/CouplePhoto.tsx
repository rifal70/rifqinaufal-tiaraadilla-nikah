"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

export default function CouplePhoto({
    src,
    alt,
}: {
    src: string;
    alt: string;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isModalLoaded, setIsModalLoaded] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!isOpen) return;

        const originalOverflow = document.body.style.overflow;
        const originalOverscroll = document.body.style.overscrollBehavior;
        document.body.style.overflow = "hidden";
        document.body.style.overscrollBehavior = "none";

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") setIsOpen(false);
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            document.body.style.overflow = originalOverflow;
            document.body.style.overscrollBehavior = originalOverscroll;
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen]);

    return (
        <>
            {/* Wadah frame tunggal: rasio diubah ke aspect-[2/3] agar lebih tinggi */}
            <div
                onClick={() => setIsOpen(true)}
                className="group relative mx-auto w-64 sm:w-72 aspect-[2/3] cursor-pointer select-none transition-transform duration-300 hover:scale-[1.02]"
                title={`Lihat foto ${alt}`}
            >
                {/* 1. Foto Pengantin (Ditinggiin dengan h-full dan inset yang pas) */}
                <div className="absolute inset-[12%] overflow-hidden rounded-[0.5rem] bg-black/40">
                    {/* Shimmer placeholder selagi foto belum selesai dimuat */}
                    <div
                        aria-hidden="true"
                        className={`absolute inset-0 skeleton-shimmer z-0 transition-opacity duration-500 ${
                            isLoaded ? "opacity-0 pointer-events-none" : "opacity-100"
                        }`}
                    />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={src}
                        alt={alt}
                        className={`h-full w-full object-cover object-[center_85%] transition-all duration-500 group-hover:scale-105 ${
                            isLoaded ? "opacity-100" : "opacity-0"
                        }`}
                        loading="lazy"
                        decoding="async"
                        onLoad={() => setIsLoaded(true)}
                    />
                </div>

                {/* 2. Bingkai Utama Menempel Sempurna Mengitari Foto */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src="/frame-couple.png"
                    alt="Bingkai Mempelai"
                    className="pointer-events-none absolute inset-0 z-10 h-full w-full object-fill scale-105 drop-shadow-[0_1px_2px_rgba(0,0,0,0)]"
                    loading="lazy"
                    decoding="async"
                />
            </div>

            {/* Modal Lightbox saat foto diklik */}
            {mounted && isOpen && createPortal(
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 p-4 backdrop-blur-md select-none touch-none overscroll-contain"
                    onClick={() => setIsOpen(false)}
                    onTouchMove={(e) => e.preventDefault()}
                    onWheel={(e) => e.stopPropagation()}
                >
                    <button
                        onClick={() => setIsOpen(false)}
                        className="absolute top-5 right-5 z-[10000] rounded-full bg-white/10 p-2.5 text-2xl text-white/80 transition-colors hover:bg-white/20 hover:text-white"
                        aria-label="Tutup"
                    >
                        ✕
                    </button>

                    <div
                        className="relative flex max-h-[85vh] max-w-[90vw] min-w-[280px] min-h-[350px] items-center justify-center overflow-hidden rounded-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {!isModalLoaded && (
                            <div
                                aria-hidden="true"
                                className="absolute inset-0 skeleton-shimmer rounded-2xl"
                            />
                        )}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={src}
                            alt={alt}
                            decoding="async"
                            onLoad={() => setIsModalLoaded(true)}
                            className={`max-h-[82vh] max-w-full rounded-2xl border-2 border-gold-400/50 object-contain shadow-[0_0_50px_rgba(0,0,0,0.9)] transition-opacity duration-300 ${
                                isModalLoaded ? "opacity-100" : "opacity-0"
                            }`}
                        />
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}