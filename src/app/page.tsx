import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getBanks, getGallery, getSettings, signedUrl, formatWeddingDate } from "@/lib/data";
import { WEDDING } from "@/lib/content";
import InvitationShell from "@/components/InvitationShell";
import DigitalGift from "@/components/DigitalGift";
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

        {/* Konten Utama Teks - Tetap Presisi di Tengah Layar */}
        <div className="relative z-10 mx-auto flex w-full max-w-[280px] sm:max-w-md md:max-w-none flex-col items-center" data-reveal>
          <p className="text-[10px] sm:text-xs uppercase tracking-[0.3em] sm:tracking-[0.4em] text-gold-300">
            The Wedding of
          </p>

          <h1 className="mt-4 sm:mt-6 font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-gold-shimmer leading-tight md:whitespace-nowrap">
            {W.groom.shortName} &amp; {W.bride.shortName}
          </h1>

          <Divider />

          <p className="font-display text-lg sm:text-2xl text-cream md:whitespace-nowrap">
            {W.date}
          </p>
        </div>

        {/* Ornamen Wayang Gunungan - Sejajar Nama Dilla & Gagang Tersembunyi */}
        <div
          aria-hidden
          className="pointer-events-none select-none z-0 absolute top-1/2
            /* Mobile: Ditarik ke atas (-translate-y-[62%]) agar puncak & badan sejajar teks nama, gagang tenggelam di bawah */
            -right-34 -translate-y-[60%] w-44 opacity-85
            /* Tablet Kecil */
            sm:-right-36 sm:-translate-y-[58%] sm:w-56 sm:opacity-95
            /* Desktop / Layar Lebar */
            md:-right-50 md:-translate-y-[55%] md:w-72 md:opacity-100
            lg:-right-54 lg:-translate-y-[55%] lg:w-84
            xl:-right-50 xl:-translate-y-[55%] xl:w-96"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/wayang_green.png"
            alt=""
            className="w-full h-auto drop-shadow-[-6px_6px_24px_rgba(212,175,55,0.28)] animate-gunungan-fast object-contain"
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

      {/* Surat Ar-Rum: 21 */}
      <section className="section-wedding text-center" id="ar-rum">
        <div className="glass-card max-w-3xl mx-auto p-6 sm:p-10 space-y-6" data-reveal>
          <p
            lang="ar"
            dir="rtl"
            className="text-xl sm:text-2xl md:text-3xl leading-[2.2] sm:leading-[2.4] font-serif text-gold-300"
          >
            وَمِنْ اٰيٰتِهٖٓ اَنْ خَلَقَ لَكُمْ مِّنْ اَنْفُسِكُمْ اَزْوَاجًا لِّتَسْكُنُوْٓا اِلَيْهَا وَجَعَلَ بَيْنَكُمْ مَّوَدَّةً وَّرَحْمَةً ۗاِنَّ فِيْ ذٰلِكَ لَاٰيٰتٍ لِّقَوْمٍ يَّتَفَكَّرُوْنَ
          </p>

          <Divider />

          <p className="text-sm sm:text-base leading-relaxed text-cream/90 italic font-light">
            &ldquo;Dan di antara tanda-tanda (kebesaran)-Nya ialah Dia menciptakan pasangan-pasangan untukmu dari jenismu sendiri, agar kamu cenderung dan merasa tenteram kepadanya, dan Dia menjadikan di antaramu rasa kasih dan sayang. Sungguh, pada yang demikian itu benar-benar terdapat tanda-tanda (kebesaran Allah) bagi kaum yang berpikir.&rdquo;
          </p>

          <p className="text-xs sm:text-sm font-semibold tracking-widest uppercase text-gold-400">
            — QS. Ar-Rum: 21 —
          </p>
        </div>
      </section>

      {/* Couple */}
      <section className="section-wedding text-center" id="mempelai">
        <div className="grid gap-10 md:grid-cols-[1fr_auto_1fr] items-center max-w-5xl w-full mx-auto">

          {/* Mempelai Pria */}
          <div className="glass-card relative flex flex-col items-center justify-center px-4 py-8 sm:px-8 sm:py-10 text-center w-full min-w-0" data-reveal>
            {groomPhotoUrl ? (
              <div className="w-full max-w-[280px] mx-auto mb-4 flex justify-center">
                <CouplePhoto src={groomPhotoUrl} alt={W.groom.name} />
              </div>
            ) : null}

            <div className="w-full my-2 flex justify-center">
              <svg viewBox="0 0 500 48" className="w-full max-w-[340px] sm:max-w-md h-auto overflow-visible">
                <text
                  x="50%"
                  y="50%"
                  dominantBaseline="central"
                  textAnchor="middle"
                  className="font-display fill-current text-gold-shimmer text-[26px] font-semibold"
                >
                  {W.groom.name}
                </text>
              </svg>
            </div>

            <p className="mt-4 text-sm text-green-100">{W.groom.childOrder}</p>
            <p className="mt-1 text-cream">{W.groom.father}</p>
            <p className="text-cream">dan {W.groom.mother}</p>
          </div>

          {/* Simbol & */}
          <span className="font-display text-4xl sm:text-5xl md:text-6xl text-gold-400" data-reveal>&amp;</span>

          {/* Mempelai Wanita */}
          <div className="glass-card relative flex flex-col items-center justify-center px-4 py-8 sm:px-8 sm:py-10 text-center w-full min-w-0" data-reveal>
            {bridePhotoUrl ? (
              <div className="w-full max-w-[280px] mx-auto mb-4 flex justify-center">
                <CouplePhoto src={bridePhotoUrl} alt={W.bride.name} />
              </div>
            ) : null}

            <div className="w-full my-2 flex justify-center">
              <svg viewBox="0 0 500 48" className="w-full max-w-[340px] sm:max-w-md h-auto overflow-visible">
                <text
                  x="50%"
                  y="50%"
                  dominantBaseline="central"
                  textAnchor="middle"
                  className="font-display fill-current text-gold-shimmer text-[26px] font-semibold"
                >
                  {W.bride.name}
                </text>
              </svg>
            </div>

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
            Kado Digital
          </h2>
          <Divider />
          <DigitalGift accounts={visibleBanks} />
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