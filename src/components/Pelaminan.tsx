"use client";

import { useEffect, useState } from "react";

export default function PelaminanScene() {
    const [assembled, setAssembled] = useState(false);

    useEffect(() => {
        // Delay sepersekian detik agar posisi awal (mencar) ter-render dulu, lalu bersatu
        const timer = setTimeout(() => {
            setAssembled(true);
        }, 150);

        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="relative w-full aspect-[1920/1000] max-w-sm xs:max-w-md sm:max-w-lg md:max-w-xl max-h-[38vh] landscape:max-h-[20vh] landscape:max-w-[220px] landscape:sm:max-w-[260px] landscape:md:max-w-[300px] landscape:lg:max-w-[340px] mx-auto select-none pointer-events-none">

            {/* 1. Bangunan Utama: Rumah Joglo (Datang dari arah atas/skala kecil) */}
            <img
                src="/pelaminan/rumah_joglo.png"
                alt=""
                className={`absolute left-[3%] bottom-0 w-[94%] h-auto z-10 object-contain transition-all duration-1000 ease-out ${assembled
                    ? "translate-y-0 scale-100 opacity-100"
                    : "-translate-y-14 scale-95 opacity-0"
                    }`}
            />

            {/* 2. Rangkaian Bunga Melati Gantung (Jatuh perlahan dari atas) */}
            <img
                src="/pelaminan/rangkaian_melati_bunga.png"
                alt=""
                className={`absolute left-[32.5%] top-[34%] w-[35%] h-auto z-15 object-contain transition-all duration-1000 delay-200 ease-out ${assembled
                    ? "translate-y-0 opacity-100"
                    : "-translate-y-10 opacity-0"
                    }`}
            />

            {/* 3. Umbul-Umbul Janur Kuning Atas (Kiri: dari kiri atas, Kanan: dari kanan atas) */}
            <img
                src="/pelaminan/umbul_umbul_kuning_atas.png"
                alt=""
                className={`absolute left-[19%] top-[36%] w-[10%] h-auto z-18 object-contain transition-all duration-1000 delay-300 ease-out ${assembled
                    ? "translate-x-0 translate-y-0 opacity-100"
                    : "-translate-x-8 -translate-y-8 opacity-0"
                    }`}
            />
            <img
                src="/pelaminan/umbul_umbul_kuning_atas.png"
                alt=""
                className={`absolute right-[19%] top-[36%] w-[10%] h-auto z-18 object-contain -scale-x-100 transition-all duration-1000 delay-300 ease-out ${assembled
                    ? "translate-x-0 translate-y-0 opacity-100"
                    : "translate-x-8 -translate-y-8 opacity-0"
                    }`}
            />

            {/* 4. Vas Bunga Kecil Tangga (Kiri & Kanan merapat ke tengah tangga) */}
            <img
                src="/pelaminan/vas_bunga_kecil.png"
                alt=""
                className={`absolute left-[38%] bottom-[24%] w-[5.5%] h-auto z-22 object-contain transition-all duration-1000 delay-400 ease-out ${assembled
                    ? "translate-x-0 opacity-100"
                    : "-translate-x-6 opacity-0"
                    }`}
            />
            <img
                src="/pelaminan/vas_bunga_kecil.png"
                alt=""
                className={`absolute right-[38%] bottom-[24%] w-[5.5%] h-auto z-22 object-contain -scale-x-100 transition-all duration-1000 delay-400 ease-out ${assembled
                    ? "translate-x-0 opacity-100"
                    : "translate-x-6 opacity-0"
                    }`}
            />

            {/* 5. Janur / Umbul-Umbul Melengkung Depan (Merapat dari sisi luar) */}
            <img
                src="/pelaminan/umbul_umbul_kuning_kiri.png"
                alt=""
                className={`absolute left-[18%] bottom-0 w-[15.5%] h-auto z-30 object-contain transition-all duration-1000 delay-500 ease-out ${assembled
                    ? "translate-x-0 opacity-100"
                    : "-translate-x-14 opacity-0"
                    }`}
            />
            <img
                src="/pelaminan/umbul_umbul_kuning_kiri.png"
                alt=""
                className={`absolute right-[18%] bottom-0 w-[15.5%] h-auto z-30 object-contain -scale-x-100 transition-all duration-1000 delay-500 ease-out ${assembled
                    ? "translate-x-0 opacity-100"
                    : "translate-x-14 opacity-0"
                    }`}
            />

            {/* 6. Vas Gunungan Padi Depan (Naik dari bawah sedikit serong) */}
            <img
                src="/pelaminan/vas_gunungan_padi.png"
                alt=""
                className={`absolute left-[29%] bottom-0 w-[10.5%] h-auto z-35 object-contain transition-all duration-1000 delay-600 ease-out ${assembled
                    ? "translate-x-0 translate-y-0 opacity-100"
                    : "-translate-x-6 translate-y-8 opacity-0"
                    }`}
            />
            <img
                src="/pelaminan/vas_gunungan_padi.png"
                alt=""
                className={`absolute right-[29%] bottom-0 w-[10.5%] h-auto z-35 object-contain -scale-x-100 transition-all duration-1000 delay-600 ease-out ${assembled
                    ? "translate-x-0 translate-y-0 opacity-100"
                    : "translate-x-6 translate-y-8 opacity-0"
                    }`}
            />

            {/* 7. Pengantin Tengah (Muncul dari bawah perlahan ke atas) */}
            <img
                src="/pelaminan/pengantin_tengah.png"
                alt=""
                className={`absolute left-[43.5%] bottom-0 w-[17.5%] h-auto z-40 object-contain drop-shadow-md transition-all duration-1000 delay-700 ease-out ${assembled
                    ? "translate-y-0 scale-100 opacity-100"
                    : "translate-y-12 scale-90 opacity-0"
                    }`}
            />

            {/* 8. Semak Daun & Bunga Kiri dan Kanan Bawah (Menyapu dari sudut bawah terluar) */}
            <img
                src="/pelaminan/semak_bunga.png"
                alt=""
                className={`absolute -left-[1%] bottom-0 w-[22%] h-auto z-45 object-contain transition-all duration-1000 delay-500 ease-out ${assembled
                    ? "translate-x-0 translate-y-0 opacity-100"
                    : "-translate-x-10 translate-y-6 opacity-0"
                    }`}
            />
            <img
                src="/pelaminan/semak_bunga.png"
                alt=""
                className={`absolute right-[0%] bottom-0 w-[22%] h-auto z-45 object-contain -scale-x-100 transition-all duration-1000 delay-500 ease-out ${assembled
                    ? "translate-x-0 translate-y-0 opacity-100"
                    : "translate-x-10 translate-y-6 opacity-0"
                    }`}
            />

            {/* 9. Obor Bambu di Ujung Kiri dan Kanan Terdepan (Masuk paling terakhir dari sisi terluar) */}
            <img
                src="/pelaminan/obor_bambu.png"
                alt=""
                className={`absolute left-[1.5%] bottom-0 w-[4.5%] h-auto z-50 object-contain drop-shadow-[0_0_10px_rgba(255,180,50,0.5)] transition-all duration-1000 delay-800 ease-out ${assembled
                    ? "translate-x-0 opacity-100"
                    : "-translate-x-10 opacity-0"
                    }`}
            />
            <img
                src="/pelaminan/obor_bambu.png"
                alt=""
                className={`absolute right-[1.5%] bottom-0 w-[4.5%] h-auto z-50 object-contain drop-shadow-[0_0_10px_rgba(255,180,50,0.5)] -scale-x-100 transition-all duration-1000 delay-800 ease-out ${assembled
                    ? "translate-x-0 opacity-100"
                    : "translate-x-10 opacity-0"
                    }`}
            />

        </div>
    );
}