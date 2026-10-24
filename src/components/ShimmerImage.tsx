"use client";

import { useState, useRef, useEffect } from "react";

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
  const imgRef = useRef<HTMLImageElement | null>(null);

  const checkLoaded = (node: HTMLImageElement | null) => {
    imgRef.current = node;
    if (node && node.complete) {
      setLoaded(true);
    }
  };

  useEffect(() => {
    const img = imgRef.current;
    if (!img || !src) {
      if (!src) setLoaded(true);
      return;
    }

    if (img.complete) {
      setLoaded(true);
      return;
    }

    if ("decode" in img) {
      img
        .decode()
        .then(() => setLoaded(true))
        .catch(() => setLoaded(true));
    }

    const handleDone = () => setLoaded(true);
    img.addEventListener("load", handleDone, { once: true });
    img.addEventListener("error", handleDone, { once: true });

    return () => {
      img.removeEventListener("load", handleDone);
      img.removeEventListener("error", handleDone);
    };
  }, [src]);

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
        ref={checkLoaded}
        src={src}
        alt={alt}
        loading={loading}
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
        className={`transition-opacity duration-500 ease-in-out ${
          loaded ? "opacity-100" : "opacity-0"
        } ${className}`}
        {...props}
      />
    </div>
  );
}
