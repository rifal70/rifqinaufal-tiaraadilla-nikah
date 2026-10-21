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
                className="w-full h-full flex items-center justify-center cursor-pointer overflow-hidden rounded-xl border border-gold-500/20 bg-black/20 p-1 sm:p-1.5 transition-all hover:scale-[1.01] hover:border-gold-500/50"
            >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={src}
                    alt={alt}
                    className="max-h-[560px] md:max-h-[640px] w-full h-full object-contain rounded-lg"
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
                        className="flex h-full w-full max-w-7xl items-center justify-center"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={src}
                            alt={alt}
                            className="max-h-[92vh] w-auto max-w-full rounded-xl border border-gold-500/30 object-contain shadow-2xl"
                        />
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}