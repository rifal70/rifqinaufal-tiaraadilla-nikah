"use client";

import { useEffect, useState } from "react";

type GalleryItem = { id: string; url: string; alt: string };

export default function Gallery({ items }: { items: GalleryItem[] }) {
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    if (active === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActive(null);
      if (e.key === "ArrowRight") setActive((i) => (i === null ? i : (i + 1) % items.length));
      if (e.key === "ArrowLeft") setActive((i) => (i === null ? i : (i - 1 + items.length) % items.length));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, items.length]);

  return (
    <>
      <div className="gallery-grid">
        {items.map((g, i) => (
          <button key={g.id} type="button" id={`gallery-${i}`} className="gallery-item" onClick={() => setActive(i)} aria-label={`Lihat ${g.alt}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={g.url} alt={g.alt} loading="lazy" decoding="async" />
          </button>
        ))}
      </div>
      {active !== null && (
        <div className="lightbox" role="dialog" aria-modal="true" onClick={() => setActive(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={items[active].url} alt={items[active].alt} onClick={(e) => e.stopPropagation()} />
          <button type="button" id="lightbox-close" className="lightbox-close" onClick={() => setActive(null)} aria-label="Tutup">
            ×
          </button>
        </div>
      )}
    </>
  );
}
