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
            {/* Wadah frame tunggal: foto di dalam mengikuti persis bentuk bingkai */}
            <div
                onClick={() => setIsOpen(true)}
                className="group relative mx-auto w-64 sm:w-72 aspect-[3/4] cursor-pointer select-none transition-transform duration-300 hover:scale-[1.02]"
                title={`Lihat foto ${alt}`}
            >
                {/* 1. Foto Pengantin (Ditarik margin masuk agar tidak keluar garis bingkai) */}
                <div className="absolute inset-[15%] overflow-hidden rounded-[2rem] bg-emerald-950/40">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={src}
                        alt={alt}
                        className="h-full w-full object-cover object-[center_18%] transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                    />
                </div>

                {/* 2. Bingkai Utama Menempel Sempurna Mengitari Foto */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src="/frame-couple.png"
                    alt="Bingkai Mempelai"
                    className="pointer-events-none absolute inset-0 z-10 h-[100%] w-[105%] object-contain scale-130 -translate-x-0 translate-y-0 drop-shadow-[0_10px_20px_rgba(0,0,0,0.55)]" />
            </div>

            {/* Modal Lightbox saat foto diklik */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 backdrop-blur-md"
                    onClick={() => setIsOpen(false)}
                >
                    <button
                        onClick={() => setIsOpen(false)}
                        className="absolute top-5 right-5 z-50 rounded-full bg-white/10 p-2.5 text-2xl text-white/80 transition-colors hover:bg-white/20 hover:text-white"
                        aria-label="Tutup"
                    >
                        ✕
                    </button>

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