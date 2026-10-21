import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getBanks, getGallery, getSettings, signedUrl, formatWeddingDate } from "@/lib/data";
import { WEDDING } from "@/lib/content";
import InvitationShell from "@/components/InvitationShell";
import DigitalGift from "@/components/DigitalGift";
import Gallery from "@/components/Gallery";
import CouplePhoto from "@/components/CouplePhoto";
import ImageModal from "@/components/ImageModal";
import LoveStory from "@/components/LoveStory";

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
          <p className="text-[14px] sm:text-l uppercase tracking-[0.3em] sm:tracking-[0.4em] text-gold-300">
            The Wedding of
          </p>

          <h1 className="mt-4 sm:mt-6 font-display text-4xl sm:text-2xl md:text-6xl lg:text-7xl text-gold-shimmer leading-tight md:whitespace-nowrap">
            {W.groom.shortName} &amp; {W.bride.shortName}
          </h1>
        </div>

        {/* Ornamen Wayang Gunungan Kiri - Sejajar Nama Rifqi & Gagang Tersembunyi */}
        <div
          aria-hidden
          className="pointer-events-none select-none z-0 absolute top-1/2
            /* Mobile: Ditarik ke atas (-translate-y-[60%]) agar puncak & badan sejajar teks nama, gagang tenggelam di bawah */
            -left-34 -translate-y-[60%] w-44 opacity-85
            /* Tablet Kecil */
            sm:-left-36 sm:-translate-y-[58%] sm:w-56 sm:opacity-95
            /* Desktop / Layar Lebar */
            md:-left-50 md:-translate-y-[55%] md:w-72 md:opacity-100
            lg:-left-54 lg:-translate-y-[55%] lg:w-84
            xl:-left-50 xl:-translate-y-[55%] xl:w-96"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/wayang_green.png"
            alt=""
            className="w-full h-auto drop-shadow-[6px_6px_24px_rgba(212,175,55,0.28)] animate-gunungan-fast-left object-contain"
          />
        </div>

        {/* Ornamen Wayang Gunungan Kanan - Sejajar Nama Dilla & Gagang Tersembunyi */}
        <div
          aria-hidden
          className="pointer-events-none select-none z-0 absolute top-1/2
            /* Mobile: Ditarik ke atas (-translate-y-[60%]) agar puncak & badan sejajar teks nama, gagang tenggelam di bawah */
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

        {/* Karakter Animasi Pengantin Berbingkai Jawa - Paling Bawah Section */}
        <div
          aria-hidden="true"
          data-reveal
          className="pointer-events-none select-none z-10 absolute bottom-0 left-0 right-0 flex justify-center items-end"
        >
          <div className="relative aspect-square w-[min(72vw,250px)] sm:w-[290px] md:w-[360px] lg:w-[420px] xl:w-[460px] landscape:w-auto landscape:h-[38dvh] landscape:max-h-[175px] md:landscape:h-[42dvh] md:landscape:max-h-[220px] flex items-center justify-center drop-shadow-[0_16px_40px_rgba(0,0,0,0.65)]">
            {/* Kartu Dalam */}
            <div className="absolute inset-[9%] sm:inset-[8%] z-10 overflow-hidden rounded-2xl bg-gradient-to-b from-[#152a19]/85 via-[#0d1d11]/90 to-[#071309]/95 backdrop-blur-sm border border-gold-400/30 flex items-end justify-center p-1 sm:p-1.5 shadow-[inset_0_0_20px_rgba(212,175,55,0.12)]">
              {/* Gambar Karakter */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/animated_naufaldilla.webp"
                alt="Ilustrasi Pengantin Rifqi &amp; Dilla"
                className="max-h-full max-w-full object-contain drop-shadow-md"
              />
            </div>
            {/* Frame Ukiran Jawa */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/frame_dillanaufalanimated.png"
              alt=""
              className="pointer-events-none absolute inset-0 z-20 h-full w-full object-fill drop-shadow-[0_4px_14px_rgba(212,175,55,0.35)]"
            />
          </div>
        </div>
      </section>

      {/* Opening */}
      <section className="section-wedding text-center relative overflow-x-clip min-h-[60vh] flex flex-col justify-between" id="pembuka">
        {/* Mega Mendung Top (Pojok Kiri Atas) */}
        <div
          aria-hidden="true"
          data-reveal
          className="pointer-events-none select-none absolute top-0 left-0 z-0"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/mega_mendung.png"
            alt=""
            className="cloud-float-top w-28 sm:w-48 md:w-64 lg:w-80 h-auto object-contain will-change-transform"
          />
        </div>

        {/* Motive 4 - Pojok Kanan Atas */}
        <div
          aria-hidden="true"
          data-reveal
          className="pointer-events-none select-none absolute top-4 -right-8 sm:top-8 sm:-right-12 z-0 rotate-12"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/motive/motive_4.png"
            alt=""
            className="motive-ornament w-32 sm:w-48 md:w-64 lg:w-72 h-auto object-contain will-change-transform"
          />
        </div>

        {/* Konten Salam Pembuka */}
        <div className="relative z-10 max-w-2xl mx-auto px-6 py-24 sm:py-32 my-auto" data-reveal>
          {settings.opening_greeting ? (
            <p className="font-display text-xl leading-relaxed text-cream whitespace-pre-line">{settings.opening_greeting}</p>
          ) : (
            <Placeholder label="teks salam pembuka dari pemilik" />
          )}
        </div>

        {/* Motive 1 - Pojok Kiri Bawah */}
        <div
          aria-hidden="true"
          data-reveal
          className="pointer-events-none select-none absolute -bottom-6 -left-8 sm:-bottom-10 sm:-left-12 z-0 -rotate-12"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/motive/motive_1.png"
            alt=""
            className="motive-ornament w-32 sm:w-48 md:w-60 lg:w-72 h-auto object-contain will-change-transform"
          />
        </div>

        {/* Mega Mendung Bottom (Pojok Kanan Bawah) - Menggunakan mega_mendung.png di-mirror */}
        <div
          aria-hidden="true"
          data-reveal
          className="pointer-events-none select-none absolute bottom-0 right-0 z-0 -scale-x-100"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/mega_mendung.png"
            alt=""
            className="cloud-float-bottom w-28 sm:w-48 md:w-64 lg:w-80 h-auto object-contain will-change-transform"
          />
        </div>
      </section>

      {/* Surat Ar-Rum: 21 */}
      <section className="section-wedding text-center relative overflow-x-clip" id="ar-rum">
        {/* Motive 1 - Pojok Kiri Atas */}
        <div
          aria-hidden="true"
          data-reveal
          className="pointer-events-none select-none absolute top-2 -left-8 sm:top-6 sm:-left-12 z-0 rotate-45"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/motive/motive_1.png"
            alt=""
            className="motive-ornament w-32 sm:w-48 md:w-64 lg:w-72 h-auto object-contain will-change-transform"
          />
        </div>

        {/* Motive 3 - Pojok Kanan Bawah */}
        <div
          aria-hidden="true"
          data-reveal
          className="pointer-events-none select-none absolute -bottom-6 -right-8 sm:-bottom-10 sm:-right-12 z-0 -rotate-15"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/motive/motive_3.png"
            alt=""
            className="motive-ornament w-32 sm:w-48 md:w-64 lg:w-76 h-auto object-contain will-change-transform"
          />
        </div>

        <div className="glass-card max-w-3xl mx-auto p-6 sm:p-10 space-y-6 relative z-10" data-reveal>
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
      <section className="section-wedding text-center relative overflow-x-clip" id="mempelai">
        {/* Motive 2 - Pojok Kanan Atas */}
        <div
          aria-hidden="true"
          data-reveal
          className="pointer-events-none select-none absolute -top-8 -right-8 sm:-top-12 sm:-right-12 z-0"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/motive/motive_2.png"
            alt=""
            className="motive-ornament w-36 sm:w-52 md:w-68 lg:w-80 h-auto object-contain will-change-transform"
          />
        </div>

        {/* Motive 5 - Pojok Kiri Bawah */}
        <div
          aria-hidden="true"
          data-reveal
          className="pointer-events-none select-none absolute -bottom-10 -left-10 sm:-bottom-14 sm:-left-14 z-0 rotate-12"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/motive/motive_5.png"
            alt=""
            className="motive-ornament w-36 sm:w-52 md:w-68 lg:w-80 h-auto object-contain will-change-transform"
          />
        </div>

        <div className="grid gap-10 md:grid-cols-[1fr_auto_1fr] items-center max-w-5xl w-full mx-auto relative z-10">

          {/* Mempelai Pria */}
          <div className="glass-card relative flex flex-col items-center justify-center px-4 py-8 sm:px-8 sm:py-10 text-center w-full min-w-0" data-reveal>
            {groomPhotoUrl ? (
              <div className="w-full max-w-[280px] mx-auto mb-4 flex justify-center">
                <CouplePhoto src={groomPhotoUrl} alt={W.groom.name} />
              </div>
            ) : null}

            <h3 className="font-display text-1xl sm:text-2xl font-bold text-gold-shimmer my-2 tracking-wide leading-snug drop-shadow-[0_2px_10px_rgba(212,175,55,0.35)]">
              {W.groom.name}
            </h3>

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

            <h3 className="font-display text-1xl sm:text-2xl font-bold text-gold-shimmer my-2 tracking-wide leading-snug drop-shadow-[0_2px_10px_rgba(212,175,55,0.35)]">
              {W.bride.name}
            </h3>

            <p className="mt-4 text-sm text-green-100">{W.bride.childOrder}</p>
            <p className="mt-1 text-cream">{W.bride.father}</p>
            <p className="text-cream">dan {W.bride.mother}</p>
          </div>

        </div>
      </section>

      {/* Events */}
      <section className="section-wedding text-center relative overflow-x-clip" id="acara">
        {/* Motive 3 - Pojok Kiri Atas */}
        <div
          aria-hidden="true"
          data-reveal
          className="pointer-events-none select-none absolute top-4 -left-10 sm:top-8 sm:-left-14 z-0 -rotate-12"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/motive/motive_3.png"
            alt=""
            className="motive-ornament w-32 sm:w-48 md:w-64 lg:w-76 h-auto object-contain will-change-transform"
          />
        </div>

        {/* Motive 1 - Pojok Kanan Bawah */}
        <div
          aria-hidden="true"
          data-reveal
          className="pointer-events-none select-none absolute -bottom-10 -right-10 sm:-bottom-14 sm:-right-16 z-0 rotate-45"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/motive/motive_1.png"
            alt=""
            className="motive-ornament w-36 sm:w-52 md:w-68 lg:w-80 h-auto object-contain will-change-transform"
          />
        </div>

        <div className="relative z-10 flex flex-col items-center w-full">
          <h2 className="font-display text-4xl md:text-5xl text-gold-shimmer" data-reveal>Waktu &amp; Tempat</h2>
          <Divider />

          {/* Save The Date */}
          <div className="flex flex-col items-center mb-8 w-full max-w-md mx-auto" data-reveal>
            <div className="relative overflow-hidden rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.35)] border border-gold-500/30 max-w-[260px] sm:max-w-[280px] transition-transform duration-300 hover:scale-[1.02]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/save_the_date.jpg"
                alt="Save The Date"
                className="w-full h-auto object-contain rounded-2xl"
                loading="lazy"
              />
            </div>
            {/* Bingkai Tanggal Pernikahan (frame_date) */}
            <div className="relative mt-4 w-full max-w-[340px] xs:max-w-[380px] sm:max-w-[420px] md:max-w-[450px] flex items-center justify-center transition-transform duration-300 hover:scale-[1.02]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/frame_date.png"
                alt="Bingkai Tanggal"
                className="w-full h-auto object-contain pointer-events-none select-none drop-shadow-[0_6px_20px_rgba(212,175,55,0.3)]"
              />
              <div className="absolute inset-0 flex items-center justify-center px-10 sm:px-12 py-3 text-center">
                <p className="font-display italic text-m xs:text-base sm:text-lg md:text-xl font-bold text-gold-shimmer tracking-wide leading-snug drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                  {W.date}
                </p>
              </div>
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-2 max-w-4xl w-full">
            {[W.akad, W.resepsi].map((e) => (
              <div key={e.title} className="glass-card-gold" data-reveal>
                <h3 className="font-display text-3xl text-gold-300">{e.title}</h3>
                <p className="mt-1 text-lg font-medium text-gold-100">{e.time}</p>
              </div>
            ))}
          </div>
          <div className="glass-card mt-6 max-w-4xl w-full" data-reveal>
            <p className="text-xs uppercase tracking-[0.3em] text-gold-300">Bertempat di</p>
            <p className="mt-3 font-display text-2xl text-cream">{W.venue.name}</p>
            <p className="mt-2 text-green-100">{W.venue.address}</p>
          </div>
        </div>
      </section>

      {/* Location */}
      <section className="section-wedding text-center relative overflow-x-clip" id="lokasi">
        {/* Motive 4 - Pojok Kanan Atas */}
        <div
          aria-hidden="true"
          data-reveal
          className="pointer-events-none select-none absolute top-2 -right-8 sm:top-6 sm:-right-14 z-0 rotate-12"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/motive/motive_4.png"
            alt=""
            className="motive-ornament w-36 sm:w-52 md:w-68 lg:w-80 h-auto object-contain will-change-transform"
          />
        </div>

        {/* Motive 2 - Pojok Kiri Bawah (Rotated) */}
        <div
          aria-hidden="true"
          data-reveal
          className="pointer-events-none select-none absolute -bottom-8 -left-8 sm:-bottom-12 sm:-left-12 z-0 rotate-180"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/motive/motive_2.png"
            alt=""
            className="motive-ornament w-32 sm:w-48 md:w-64 lg:w-76 h-auto object-contain will-change-transform"
          />
        </div>

        <div className="relative z-10 flex flex-col items-center w-full">
          <h2 className="font-display text-4xl md:text-5xl text-gold-shimmer" data-reveal>
            Denah &amp; Lokasi
          </h2>
          <Divider />

          <div className="mx-auto max-w-6xl w-full space-y-8" data-reveal>
            <div className="grid gap-6 md:grid-cols-[3fr_2fr] items-stretch">
              {/* 1. Denah Lokasi */}
              <div className="glass-card flex flex-col items-center justify-center p-2.5 sm:p-4 md:p-5 h-full">
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
                <p className="text-xs text-green-200/70 mt-4 mb-5 max-w-[220px] leading-relaxed">
                  Arahkan kamera HP ke QR Code untuk rute langsung
                </p>

                {/* Tombol Buka Google Maps */}
                {settings.maps_url ? (
                  <a
                    id="maps-link"
                    href={settings.maps_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-gold inline-flex items-center gap-2 px-6 py-2.5 text-xs sm:text-sm font-semibold tracking-wider uppercase transition-all duration-200 hover:scale-[1.02] active:scale-95 shadow-md"
                  >
                    <span>Buka di Google Maps</span>
                    <span>↗</span>
                  </a>
                ) : (
                  <Placeholder label="tautan Google Maps" />
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Love Story */}
      <section className="section-wedding text-center relative overflow-x-clip" id="cerita">
        {/* Motive 2 - Pojok Kiri Atas */}
        <div
          aria-hidden="true"
          data-reveal
          className="pointer-events-none select-none absolute top-2 -left-8 sm:top-6 sm:-left-12 z-0 rotate-12"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/motive/motive_2.png"
            alt=""
            className="motive-ornament w-32 sm:w-48 md:w-64 lg:w-76 h-auto object-contain will-change-transform"
          />
        </div>

        {/* Motive 5 - Pojok Kanan Bawah */}
        <div
          aria-hidden="true"
          data-reveal
          className="pointer-events-none select-none absolute -bottom-8 -right-8 sm:-bottom-12 sm:-right-12 z-0 rotate-180"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/motive/motive_5.png"
            alt=""
            className="motive-ornament w-36 sm:w-52 md:w-68 lg:w-80 h-auto object-contain will-change-transform"
          />
        </div>

        <div className="relative z-10 flex flex-col items-center w-full">
          <h2 className="font-display text-4xl md:text-5xl text-gold-shimmer" data-reveal>
            Cerita Cinta Kami
          </h2>
          <Divider />
          <div className="w-full max-w-3xl mx-auto font-serif" data-reveal>
            {settings.love_story ? (
              <LoveStory story={settings.love_story} />
            ) : (
              <Placeholder label="teks cerita cinta kami dari pemilik" />
            )}
          </div>
        </div>
      </section>

      {/* Gallery */}
      <section className="section-wedding text-center relative overflow-x-clip" id="galeri">
        {/* Motive 5 - Pojok Kiri Atas (Flipped) */}
        <div
          aria-hidden="true"
          data-reveal
          className="pointer-events-none select-none absolute top-0 -left-8 sm:top-4 sm:-left-12 z-0 -scale-x-100 rotate-6"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/motive/motive_5.png"
            alt=""
            className="motive-ornament w-36 sm:w-52 md:w-68 lg:w-80 h-auto object-contain will-change-transform"
          />
        </div>

        {/* Motive 3 - Pojok Kanan Bawah */}
        <div
          aria-hidden="true"
          data-reveal
          className="pointer-events-none select-none absolute -bottom-8 -right-8 sm:-bottom-12 sm:-right-14 z-0 rotate-180"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/motive/motive_3.png"
            alt=""
            className="motive-ornament w-32 sm:w-48 md:w-64 lg:w-76 h-auto object-contain will-change-transform"
          />
        </div>

        {/* Motive 1 - Sisi Kanan Tengah */}
        <div
          aria-hidden="true"
          data-reveal
          className="pointer-events-none select-none absolute top-1/2 -right-12 sm:-right-16 -translate-y-1/2 z-0 -rotate-45 hidden md:block"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/motive/motive_1.png"
            alt=""
            className="motive-ornament w-32 sm:w-44 md:w-56 h-auto object-contain will-change-transform"
          />
        </div>

        <div className="relative z-10 flex flex-col items-center w-full">
          <h2 className="font-display text-4xl md:text-5xl text-gold-shimmer" data-reveal>Galeri</h2>
          <Divider />
          <div className="max-w-5xl w-full" data-reveal>
            {gallery.length ? <Gallery items={gallery} /> : <Placeholder label="foto galeri dari pemilik" />}
          </div>
        </div>
      </section>

      {/* Gifts / Amplop Digital */}
      {visibleBanks.length > 0 && (
        <section className="section-wedding text-center relative overflow-x-clip" id="amplop">
          {/* Motive 1 - Pojok Kanan Atas */}
          <div
            aria-hidden="true"
            data-reveal
            className="pointer-events-none select-none absolute top-2 -right-8 sm:top-6 sm:-right-14 z-0 rotate-15"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/motive/motive_1.png"
              alt=""
              className="motive-ornament w-32 sm:w-48 md:w-64 lg:w-76 h-auto object-contain will-change-transform"
            />
          </div>

          {/* Motive 4 - Pojok Kiri Bawah */}
          <div
            aria-hidden="true"
            data-reveal
            className="pointer-events-none select-none absolute -bottom-6 -left-8 sm:-bottom-10 sm:-left-12 z-0 -rotate-12"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/motive/motive_4.png"
              alt=""
              className="motive-ornament w-36 sm:w-52 md:w-68 lg:w-80 h-auto object-contain will-change-transform"
            />
          </div>

          <div className="relative z-10 flex flex-col items-center w-full">
            <h2 className="font-display text-4xl md:text-5xl text-gold-shimmer" data-reveal>
              Kado Digital
            </h2>
            <Divider />
            <DigitalGift accounts={visibleBanks} greeting={settings.digital_gift_text} />
          </div>
        </section>
      )}

      {/* Closing */}
      <section
        className="section-wedding text-center relative overflow-hidden min-h-[100svh] landscape:min-h-[100dvh] flex flex-col justify-center items-center py-12 sm:py-16 md:py-20 landscape:py-6 px-4"
        id="penutup"
      >
        {/* Motive 6 - Pojok Kiri Bawah */}
        <div
          aria-hidden="true"
          data-reveal
          className="pointer-events-none select-none absolute -bottom-6 -left-8 sm:-bottom-10 sm:-left-12 z-0 -rotate-12"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/motive/motive_6.png"
            alt=""
            className="motive-ornament w-36 sm:w-52 md:w-68 lg:w-80 h-auto object-contain will-change-transform"
          />
        </div>

        {/* Motive 7 - Pojok Kanan Bawah */}
        <div
          aria-hidden="true"
          data-reveal
          className="pointer-events-none select-none absolute -bottom-6 -right-8 sm:-bottom-10 sm:-right-12 z-0 rotate-12"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/motive/motive_7.png"
            alt=""
            className="motive-ornament w-36 sm:w-52 md:w-68 lg:w-80 h-auto object-contain will-change-transform"
          />
        </div>

        {/* Kotak Salam Penutup (Tetap Presisi di Tengah tanpa tergeser) */}
        <div className="glass-card max-w-xl md:max-w-2xl w-full mx-auto relative z-10 p-6 sm:p-8 md:p-10 space-y-4 sm:space-y-6 landscape:py-4 landscape:space-y-3 text-center my-auto bg-black/35 backdrop-blur-md shadow-2xl" data-reveal>
          {settings.closing_greeting ? (
            <p className="font-display text-xl leading-relaxed text-cream whitespace-pre-line">{settings.closing_greeting}</p>
          ) : (
            <Placeholder label="teks salam penutup dari pemilik" />
          )}

          <Divider />

          <p className="font-display text-3xl sm:text-4xl text-gold-shimmer">
            {W.groom.shortName} &amp; {W.bride.shortName}
          </p>
        </div>
      </section>
    </InvitationShell>
  );
}