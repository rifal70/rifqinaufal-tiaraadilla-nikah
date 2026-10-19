import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getBanks, getGallery, getSettings, signedUrl, formatWeddingDate } from "@/lib/data";
import { WEDDING } from "@/lib/content";
import InvitationShell from "@/components/InvitationShell";
import BankCard from "@/components/BankCard";
import Gallery from "@/components/Gallery";
import CouplePhoto from "@/components/CouplePhoto";
import ImageModal from "@/components/ImageModal";

export const dynamic = "force-dynamic";

function Divider() {
  return (
    <div className="ornament-divider" aria-hidden>
      <span className="ornament-diamond" />
    </div>
  );
}

function Placeholder({ label }: { label: string }) {
  return <p className="placeholder-box">[PLACEHOLDER — {label}]</p>;
}

export default async function Home() {
  const session = await getSession();
  if (!session) notFound();

  const [banks, gallery, settings] = await Promise.all([getBanks(), getGallery(), getSettings()]);
  const [musicUrl, mapImageUrl, groomPhotoUrl, bridePhotoUrl] = await Promise.all([
    signedUrl(settings.music_path),
    signedUrl(settings.map_image_path),
    signedUrl(settings.groom_photo_path),
    signedUrl(settings.bride_photo_path),
  ]);

  // --- LOGIKA TANGGAL DINAMIS ---
  let weddingDate = WEDDING.date;
  if (settings.event_date) {
    let cleanDate = settings.event_date.trim().replace(/^["']|["']$/g, "");
    if (cleanDate.includes(" ") && !cleanDate.includes("+")) {
      cleanDate = cleanDate.replace(" ", "+");
    }
    const parsed = new Date(cleanDate);
    if (!isNaN(parsed.getTime())) {
      weddingDate = formatWeddingDate(parsed);
    }
  }

  // Gabungkan objek WEDDING dengan tanggal dinamis
  const W = {
    ...WEDDING,
    date: weddingDate,
  };

  // Filter rekening khusus yang dicentang untuk tamu ini
  const visibleBanks =
    banks?.filter((b) => {
      const isValid = b.is_enabled && b.bank_name?.trim() !== "-" && b.account_number?.trim() !== "-";
      if (!isValid) return false;

      if (session.visible_bank_ids && Array.isArray(session.visible_bank_ids)) {
        return session.visible_bank_ids.includes(b.id);
      }

      return true;
    }) ?? [];

  return (
    <InvitationShell
      guestName={session.guest_name}
      coupleNames={`${W.groom.shortName} & ${W.bride.shortName}`}
      date={W.date}
      musicUrl={musicUrl}
    >
      {/* Hero */}
      <section className="section-wedding hero-bg relative flex min-h-[100svh] w-full flex-col items-center justify-center overflow-hidden px-4 py-12 text-center" id="hero">

        {/* Konten Utama Teks */}
        {/* Di mobile max-w dibatasi agar wrap aman, di desktop (md ke atas) dibuka penuh (max-w-none) */}
        <div className="relative z-10 mx-auto flex w-full max-w-[280px] sm:max-w-md md:max-w-none flex-col items-center" data-reveal>
          <p className="text-[10px] sm:text-xs uppercase tracking-[0.3em] sm:tracking-[0.4em] text-gold-300">
            The Wedding of
          </p>

          {/* md:whitespace-nowrap menjamin "Naufal & Dilla" selalu 1 baris di desktop */}
          <h1 className="mt-4 sm:mt-6 font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-gold-shimmer leading-tight md:whitespace-nowrap">
            {W.groom.shortName} &amp; {W.bride.shortName}
          </h1>

          <Divider />

          <p className="font-display text-lg sm:text-2xl text-cream md:whitespace-nowrap">
            {W.date}
          </p>
        </div>

        {/* Gambar Wayang */}
        <div
          aria-hidden
          className="pointer-events-none select-none z-0 absolute top-1/2 -translate-y-1/2
            /* Mobile: geser keluar (-right-24) dengan ukuran kecil agar tidak nabrak teks */
            -right-20 w-36 opacity-70
            /* Tablet */
            sm:-right-12 sm:w-52 sm:opacity-85
            /* Desktop (md): Geser menempel tepi kanan layar */
            md:-right-5 md:w-64 md:opacity-95
            /* Desktop Lebar (lg/xl): Ukuran megah */
            lg:-right-3 lg:w-80 lg:opacity-100
            xl:right-2 xl:w-96"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/wayang.png"
            alt=""
            className="w-full h-auto drop-shadow-[0_4px_24px_rgba(212,175,55,0.3)] animate-wayang object-contain"
          />
        </div>
      </section>

      {/* Opening */}
      <section className="section-wedding text-center" id="pembuka">
        <div className="max-w-2xl" data-reveal>
          {settings.opening_greeting ? (
            <p className="font-display text-xl leading-relaxed text-cream whitespace-pre-line">{settings.opening_greeting}</p>
          ) : (
            <Placeholder label="teks salam pembuka dari pemilik" />
          )}
        </div>
      </section>

      {/* Couple */}
      <section className="section-wedding text-center" id="mempelai">
        <div className="grid gap-10 md:grid-cols-[1fr_auto_1fr] items-center max-w-5xl w-full mx-auto">
          {/* Mempelai Pria */}
          <div className="glass-card flex flex-col items-center justify-center p-6 sm:p-10 text-center" data-reveal>
            {groomPhotoUrl ? (
              <CouplePhoto src={groomPhotoUrl} alt={W.groom.name} />
            ) : null}

            <h3 className="font-display text-3xl md:text-4xl text-gold-shimmer">{W.groom.name}</h3>
            <p className="mt-4 text-sm text-green-100">{W.groom.childOrder}</p>
            <p className="mt-1 text-cream">{W.groom.father}</p>
            <p className="text-cream">dan {W.groom.mother}</p>
          </div>

          {/* Simbol & */}
          <span className="font-display text-6xl text-gold-400" data-reveal>&amp;</span>

          {/* Mempelai Wanita */}
          <div className="glass-card flex flex-col items-center justify-center p-6 sm:p-10 text-center" data-reveal>
            {bridePhotoUrl ? (
              <CouplePhoto src={bridePhotoUrl} alt={W.bride.name} />
            ) : null}

            <h3 className="font-display text-3xl md:text-4xl text-gold-shimmer">{W.bride.name}</h3>
            <p className="mt-4 text-sm text-green-100">{W.bride.childOrder}</p>
            <p className="mt-1 text-cream">{W.bride.father}</p>
            <p className="text-cream">dan {W.bride.mother}</p>
          </div>
        </div>
      </section>

      {/* Events */}
      <section className="section-wedding text-center" id="acara">
        <h2 className="font-display text-4xl md:text-5xl text-gold-shimmer" data-reveal>Waktu &amp; Tempat</h2>
        <Divider />
        <div className="grid gap-6 md:grid-cols-2 max-w-4xl w-full">
          {[W.akad, W.resepsi].map((e) => (
            <div key={e.title} className="glass-card-gold" data-reveal>
              <h3 className="font-display text-3xl text-gold-300">{e.title}</h3>
              <p className="mt-4 text-cream">{W.date}</p>
              <p className="mt-1 text-lg font-medium text-gold-100">{e.time}</p>
            </div>
          ))}
        </div>
        <div className="glass-card mt-6 max-w-4xl w-full" data-reveal>
          <p className="text-xs uppercase tracking-[0.3em] text-gold-300">Bertempat di</p>
          <p className="mt-3 font-display text-2xl text-cream">{W.venue.name}</p>
          <p className="mt-2 text-green-100">{W.venue.address}</p>
        </div>
      </section>

      {/* Location */}
      <section className="section-wedding text-center" id="lokasi">
        <h2 className="font-display text-4xl md:text-5xl text-gold-shimmer" data-reveal>
          Denah &amp; Lokasi
        </h2>
        <Divider />

        <div className="mx-auto max-w-6xl w-full space-y-8" data-reveal>
          <div className="grid gap-6 md:grid-cols-[3fr_2fr] items-stretch">
            {/* 1. Denah Lokasi */}
            <div className="glass-card flex flex-col items-center justify-center p-6 md:p-8 h-full">
              <p className="text-xs uppercase tracking-widest text-gold-300 mb-4 font-semibold">
                Denah Lokasi
              </p>
              {mapImageUrl ? (
                <ImageModal src={mapImageUrl} alt="Denah lokasi acara" />
              ) : (
                <Placeholder label="gambar Denah Lokasi" />
              )}
            </div>

            {/* 2. Scan QR Code Maps */}
            <div className="glass-card flex flex-col items-center justify-center p-6 h-full bg-emerald-950/20">
              <p className="text-xs uppercase tracking-widest text-gold-300 mb-6 font-semibold">
                Scan QR Google Maps
              </p>
              <div className="relative p-3 bg-white rounded-2xl shadow-lg border border-gold-500/20 max-w-[200px] md:max-w-[220px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/qr-maps.png"
                  alt="Scan QR Google Maps"
                  className="w-full h-auto aspect-square object-contain rounded-lg"
                  loading="lazy"
                />
              </div>
              <p className="text-xs text-green-200/70 mt-6 max-w-[200px] leading-relaxed">
                Arahkan kamera HP ke QR Code untuk rute langsung
              </p>
            </div>
          </div>

          {/* 3. Tombol Buka Google Maps */}
          <div className="pt-2">
            {settings.maps_url ? (
              <a
                id="maps-link"
                href={settings.maps_url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-gold inline-flex items-center gap-2 px-8 py-3 text-sm font-semibold tracking-wider uppercase transition-all duration-200 hover:scale-[1.02] active:scale-95 shadow-md"
              >
                <span>Buka di Google Maps</span>
                <span>↗</span>
              </a>
            ) : (
              <Placeholder label="tautan Google Maps" />
            )}
          </div>
        </div>
      </section>

      {/* Gallery */}
      <section className="section-wedding text-center" id="galeri">
        <h2 className="font-display text-4xl md:text-5xl text-gold-shimmer" data-reveal>Galeri</h2>
        <Divider />
        <div className="max-w-5xl w-full" data-reveal>
          {gallery.length ? <Gallery items={gallery} /> : <Placeholder label="foto galeri dari pemilik" />}
        </div>
      </section>

      {/* Gifts / Amplop Digital */}
      {visibleBanks.length > 0 && (
        <section className="section-wedding text-center" id="amplop">
          <h2 className="font-display text-4xl md:text-5xl text-gold-shimmer" data-reveal>
            Amplop Digital
          </h2>
          <Divider />
          <div className="mx-auto flex flex-wrap justify-center gap-6 max-w-5xl w-full">
            {visibleBanks.map((b) => (
              <div key={b.id} data-reveal className="w-full sm:w-80">
                <BankCard account={b} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Closing */}
      <section className="section-wedding text-center" id="penutup">
        <div className="max-w-2xl" data-reveal>
          {settings.closing_greeting ? (
            <p className="font-display text-xl leading-relaxed text-cream whitespace-pre-line">{settings.closing_greeting}</p>
          ) : (
            <Placeholder label="teks salam penutup dari pemilik" />
          )}
        </div>
        <Divider />
        <p className="font-display text-4xl text-gold-shimmer" data-reveal>
          {W.groom.shortName} &amp; {W.bride.shortName}
        </p>
      </section>
    </InvitationShell>
  );
}