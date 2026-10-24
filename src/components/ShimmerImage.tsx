"use client";

import { useState } from "react";

interface ShimmerImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  containerClassName?: string;
  shimmerClassName?: string;
}

export default function ShimmerImage({
  src,
  alt = "",
  className = "",
  containerClassName = "",
  shimmerClassName = "",
  loading = "lazy",
  ...props
}: ShimmerImageProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className={`relative overflow-hidden ${containerClassName}`}>
      {/* Shimmer skeleton saat media belum selesai dimuat */}
      <div
        aria-hidden="true"
        className={`absolute inset-0 skeleton-shimmer z-0 transition-opacity duration-500 ${
          loaded ? "opacity-0 pointer-events-none" : "opacity-100"
        } ${shimmerClassName}`}
      />

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading={loading}
        decoding="async"
        onLoad={() => setLoaded(true)}
        className={`transition-opacity duration-500 ease-in-out ${
          loaded ? "opacity-100" : "opacity-0"
        } ${className}`}
        {...props}
      />
    </div>
  );
}
