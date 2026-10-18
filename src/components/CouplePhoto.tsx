"use client";

import { useState } from "react";

export default function CouplePhoto({
    src,
    alt,
}: {
    src: string;
    alt: string;
}) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            {/* Wadah Foto di Kartu (Bisa diklik, tanpa tulisan petunjuk) */}
            <div
                onClick={() => setIsOpen(true)}
                className="group relative mx-auto mb-6 h-60 w-60 sm:h-72 sm:w-72 cursor-pointer overflow-hidden rounded-full border-4 border-gold-400 p-1.5 shadow-[0_0_35px_rgba(212,175,55,0.4)] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_45px_rgba(212,175,55,0.6)]"
            >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={src}
                    alt={alt}
                    className="h-full w-full rounded-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                />
            </div>

            {/* Modal Lightbox saat foto diklik */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 backdrop-blur-md"
                    onClick={() => setIsOpen(false)}
                >
                    {/* Tombol Tutup */}
                    <button
                        onClick={() => setIsOpen(false)}
                        className="absolute top-5 right-5 z-50 rounded-full bg-white/10 p-2.5 text-2xl text-white/80 transition-colors hover:bg-white/20 hover:text-white"
                        aria-label="Tutup"
                    >
                        ✕
                    </button>

                    {/* Foto Ukuran Penuh */}
                    <div
                        className="relative flex max-h-[85vh] max-w-[90vw] items-center justify-center"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={src}
                            alt={alt}
                            className="max-h-[82vh] max-w-full rounded-2xl border-2 border-gold-400/50 object-contain shadow-[0_0_50px_rgba(0,0,0,0.9)]"
                        />
                    </div>
                </div>
            )}
        </>
    );
}