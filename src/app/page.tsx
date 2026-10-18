import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getBanks, getGallery, getSettings, signedUrl } from "@/lib/data";
import { WEDDING } from "@/lib/content";
import InvitationShell from "@/components/InvitationShell";
import BankCard from "@/components/BankCard";
import Gallery from "@/components/Gallery";

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
  const [musicUrl, mapImageUrl] = await Promise.all([signedUrl(settings.music_path), signedUrl(settings.map_image_path)]);
  const W = WEDDING;

  // Filter rekening khusus yang dicentang untuk tamu ini
  const visibleBanks = banks?.filter((b) => {
    // 1. Validasi teks rekening
    const isValid = b.is_enabled && b.bank_name?.trim() !== "-" && b.account_number?.trim() !== "-";
    if (!isValid) return false;

    // 2. Cocokkan dengan array visible_bank_ids dari session tamu
    if (session.visible_bank_ids && Array.isArray(session.visible_bank_ids)) {
      return session.visible_bank_ids.includes(b.id);
    }

    // Fallback: Jika tamu belum di-set pilihannya (null/undefined), tampilkan semua rekening aktif
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
      <section className="section-wedding hero-bg text-center" id="hero">
        <p className="text-xs uppercase tracking-[0.4em] text-gold-300" data-reveal>The Wedding of</p>
        <h1 className="mt-6 font-display text-5xl md:text-7xl text-gold-shimmer" data-reveal>
          {W.groom.shortName} &amp; {W.bride.shortName}
        </h1>
        <Divider />
        <p className="font-display text-2xl text-cream" data-reveal>{W.date}</p>
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
          <div className="glass-card" data-reveal>
            <h3 className="font-display text-3xl md:text-4xl text-gold-shimmer">{W.groom.name}</h3>
            <p className="mt-4 text-sm text-green-100">{W.groom.childOrder}</p>
            <p className="mt-1 text-cream">{W.groom.father}</p>
            <p className="text-cream">dan {W.groom.mother}</p>
          </div>

          {/* Simbol & */}
          <span className="font-display text-6xl text-gold-400" data-reveal>&amp;</span>

          {/* Mempelai Wanita */}
          <div className="glass-card" data-reveal>
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
          {/* Grid Kustom: Kolom pertama (Denah) dibuat jauh lebih lebar dari kolom kedua (QR) */}
          <div className="grid gap-6 md:grid-cols-[3fr_2fr] items-stretch">

            {/* 1. Denah Lokasi (Kolom Utama - Diperbesar) */}
            <div className="glass-card flex flex-col items-center justify-center p-6 md:p-8 h-full">
              <p className="text-xs uppercase tracking-widest text-gold-300 mb-4 font-semibold">
                Denah Lokasi
              </p>
              {mapImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={mapImageUrl}
                  alt="Denah lokasi acara"
                  className="rounded-xl max-h-[480px] md:max-h-[500px] w-full object-contain shadow-xl border border-gold-500/20 transition-transform hover:scale-[1.01]"
                  loading="lazy"
                />
              ) : (
                <Placeholder label="gambar Denah Lokasi" />
              )}
            </div>

            {/* 2. Scan QR Code Maps (Kolom Pendamping - Lebih Ringkas) */}
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

      {/* Gifts / Amplop Digital (Hanya dirender jika ada rekening yang aktif & dicentang) */}
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