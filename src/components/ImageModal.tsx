"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

export default function ImageModal({
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
            {/* Thumbnail */}
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="relative w-full h-full min-h-[220px] flex items-center justify-center cursor-pointer overflow-hidden rounded-xl border border-gold-500/20 bg-black/20 p-1 sm:p-1.5 transition-all hover:scale-[1.01] hover:border-gold-500/50"
            >
                {!isLoaded && (
                    <div
                        aria-hidden="true"
                        className="absolute inset-0 skeleton-shimmer z-0 rounded-xl"
                    />
                )}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={src}
                    alt={alt}
                    className={`max-h-[560px] md:max-h-[640px] w-full h-full object-contain rounded-lg transition-opacity duration-500 ${
                        isLoaded ? "opacity-100" : "opacity-0"
                    }`}
                    loading="lazy"
                    decoding="async"
                    onLoad={() => setIsLoaded(true)}
                />
            </button>

            {/* Modal Popup Full Lebar */}
            {mounted && isOpen && createPortal(
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 p-2 sm:p-6 backdrop-blur-sm select-none touch-none overscroll-contain"
                    onClick={() => setIsOpen(false)}
                    onTouchMove={(e) => e.preventDefault()}
                    onWheel={(e) => e.stopPropagation()}
                >
                    {/* Tombol Tutup */}
                    <button
                        type="button"
                        onClick={() => setIsOpen(false)}
                        className="absolute top-4 right-4 z-[10000] flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-xl text-gold-300 hover:bg-white/20 hover:text-white"
                    >
                        ✕
                    </button>

                    {/* Kontainer Gambar Lebar */}
                    <div
                        className="relative flex h-full w-full max-w-7xl min-h-[300px] items-center justify-center overflow-hidden rounded-xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {!isModalLoaded && (
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
                            onLoad={() => setIsModalLoaded(true)}
                            className={`max-h-[92vh] w-auto max-w-full rounded-xl border border-gold-500/30 object-contain shadow-2xl transition-opacity duration-300 ${
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