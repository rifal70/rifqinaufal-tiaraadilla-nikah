"use client";

import React, { useEffect } from "react";
import WaitingScreen from "@/components/WaitingScreen";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Traffic / App error captured by boundary:", error);
  }, [error]);

  return (
    <WaitingScreen
      countdownSeconds={6}
      onRetry={reset}
      title="Harap Tunggu Beberapa Saat"
      subtitle="Undangan Sedang Ramai Diakses"
      message="Saat ini undangan pernikahan kami sedang diakses oleh banyak tamu secara bersamaan. Harap tunggu sebentar, halaman akan memuat ulang secara otomatis..."
    />
  );
}
