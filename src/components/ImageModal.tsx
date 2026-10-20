"use client";

import { useState } from "react";

export default function ImageModal({
    src,
    alt,
}: {
    src: string;
    alt: string;
}) {
    const [isOpen, setIsOpen] = useState(false);

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
            {isOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-2 sm:p-6 backdrop-blur-sm"
                    onClick={() => setIsOpen(false)}
                >
                    {/* Tombol Tutup */}
                    <button
                        type="button"
                        onClick={() => setIsOpen(false)}
                        className="absolute top-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-xl text-gold-300 hover:bg-white/20 hover:text-white"
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
                </div>
            )}
        </>
    );
}