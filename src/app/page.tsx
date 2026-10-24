import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { getSession } from "@/lib/auth/session";
import { getBanks, getGallery, getSettings, signedUrl, formatWeddingDate } from "@/lib/data";
import { isAllowedInMemory, clientIp } from "@/lib/rate-limit";
import { WEDDING } from "@/lib/content";
import InvitationShell from "@/components/InvitationShell";
import DigitalGift from "@/components/DigitalGift";
import Gallery from "@/components/Gallery";
import CouplePhoto from "@/components/CouplePhoto";
import ImageModal from "@/components/ImageModal";
import LoveStory from "@/components/LoveStory";
import WaitingScreen from "@/components/WaitingScreen";
import ShimmerImage from "@/components/ShimmerImage";
import ScrollToTop from "@/components/ScrollToTop";
import WeddingFireworks from "@/components/WeddingFireworks";

export const dynamic = "force-dynamic";

function Divider() {
  return (
    <div className="ornament-divider" aria-hidden>
      <span className="ornament-diamond" />
    </div>
  );
}

function Placeholder({
  label = "tulisan",
  lines = 3,
  card = false,
}: {
  label?: string;
  lines?: number;
  card?: boolean;
}) {
  const content = (
    <div className="w-full max-w-xl mx-auto space-y-3 py-2 animate-pulse" title={label}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-3.5 sm:h-4 skeleton-shimmer rounded-full"
          style={{
            width: i === lines - 1 ? "55%" : i === 0 ? "88%" : "98%",
            margin: "0 auto",
          }}
        />
      ))}
      <span className="sr-only">Memuat {label}...</span>
    </div>
  );

  if (card) {
    return (
      <div className="glass-card max-w-3xl mx-auto p-6 sm:p-10 text-center">
        {content}
      </div>
    );
  }

  return content;
}

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<{ status?: string; error?: string; test?: string }>;
}) {
  const params = searchParams ? await searchParams : undefined;
  if (params?.status === "busy") {
    return <WaitingScreen />;
  }

  // Tampilkan simulasi pop-up koneksi bermasalah langsung di layar jika ada parameter ?error=media atau ?test=media-error
  if (params?.error === "media" || params?.test === "media-error") {
    return (
      <main className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md select-none">
        <div className="relative mx-auto flex w-full max-w-sm flex-col items-center rounded-2xl border border-gold-400/40 bg-gradient-to-b from-green-950/95 to-green-900/95 p-6 sm:p-7 text-center text-cream shadow-2xl backdrop-blur-md">
          <div className="mb-4 flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full border border-gold-400/50 bg-gold-400/10 shadow-[0_0_20px_rgba(212,175,55,0.2)]">
            <svg
              className="h-7 w-7 sm:h-8 sm:w-8 text-gold-300"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M1 1l22 22" />
              <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
              <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
              <path d="M10.71 5.05A16 16 0 0 1 22.58 9" />
              <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
              <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
              <line x1="12" y1="20" x2="12.01" y2="20" />
            </svg>
          </div>
          <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-gold-300">
            Koneksi Bermasalah
          </p>
          <h2 className="mt-1.5 font-display text-xl sm:text-2xl font-bold text-gold-shimmer leading-tight">
            Gagal Memuat Media
          </h2>
          <div className="ornament-divider my-2.5 sm:my-3" aria-hidden="true">
            <span className="ornament-diamond" />
          </div>
          <p className="text-xs sm:text-sm text-green-100/85 leading-relaxed">
            Beberapa foto atau media undangan tidak dapat dimuat karena gangguan koneksi internet.
            Silakan muat ulang halaman untuk mencoba kembali.
          </p>
          <div className="mt-6 flex w-full flex-col gap-2">
            <a
              href="/"
              className="btn-gold w-full py-2.5 text-xs sm:text-sm font-semibold tracking-wide transition-transform hover:scale-[1.02] active:scale-[0.98] shadow-md text-center"
            >
              Muat Ulang Halaman
            </a>
            <a
              href="/"
              className="w-full py-1.5 text-xs text-gold-300/70 hover:text-gold-200 transition-colors text-center"
            >
              Tutup &amp; Lanjutkan Membaca
            </a>
          </div>
        </div>
      </main>
    );
  }

  const h = await headers();
  const ip = clientIp(h);
  // Proteksi lonjakan request: maks 40 request per 10 detik per IP
  if (!isAllowedInMemory(`home:${ip}`, 40, 10)) {
    return <WaitingScreen />;
  }

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
  let eventDateObj = new Date("2026-12-29T08:00:00+07:00");
  if (settings.event_date) {
    let cleanDate = settings.event_date.trim().replace(/^["']|["']$/g, "");
    if (cleanDate.includes(" ") && !cleanDate.includes("+")) {
      cleanDate = cleanDate.replace(" ", "+");
    }
    const parsed = new Date(cleanDate);
    if (!isNaN(parsed.getTime())) {
      eventDateObj = parsed;
      weddingDate = formatWeddingDate(parsed);
    }
  }

  const weddingDateParts = {
    dayName: new Intl.DateTimeFormat("id-ID", { weekday: "long", timeZone: "Asia/Jakarta" })
      .format(eventDateObj)
      .toUpperCase(),
    dayNumber: new Intl.DateTimeFormat("id-ID", { day: "numeric", timeZone: "Asia/Jakarta" })
      .format(eventDateObj),
    monthName: new Intl.DateTimeFormat("id-ID", { month: "long", timeZone: "Asia/Jakarta" })
      .format(eventDateObj)
      .toUpperCase(),
    yearNumber: new Intl.DateTimeFormat("id-ID", { year: "numeric", timeZone: "Asia/Jakarta" })
      .format(eventDateObj),
  };

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
      envelopeMessage={settings.envelope_message}
    >
      {/* Hero */}
      <section className="section-wedding hero-bg relative flex min-h-[100svh] w-full flex-col items-center justify-center overflow-hidden px-4 py-12 text-center" id="hero">
        {/* Efek Petasan Emas Lembut & Anggun (Wedding Fireworks) */}
        <WeddingFireworks />

        {/* Konten Utama Teks - Posisi Lebih ke Atas */}
        <div className="relative z-10 mx-auto flex w-full max-w-[280px] sm:max-w-md md:max-w-none flex-col items-center -translate-y-16 sm:-translate-y-20 md:-translate-y-24 lg:-translate-y-28 landscape:-translate-y-10 sm:landscape:-translate-y-12 md:landscape:-translate-y-20 lg:landscape:-translate-y-24 xl:landscape:-translate-y-28" data-reveal>
          {/* Ornamen Bunga Hijau Besar di Atas "The Wedding of" (Absolute agar TIDAK mendorong teks "The Wedding of" turun) */}
          <div
            aria-hidden="true"
            className="pointer-events-none select-none absolute bottom-full left-1/2 -translate-x-1/2 w-[min(92vw,340px)] xs:w-[380px] sm:w-[400px] md:w-[580px] lg:w-[680px] xl:w-[760px] aspect-square translate-y-[24%] sm:translate-y-[33%] md:translate-y-[24%] landscape:w-[220px] sm:landscape:w-[260px] md:landscape:w-[340px] lg:landscape:w-[420px] landscape:translate-y-[31%] sm:landscape:translate-y-[32%] md:landscape:translate-y-[36%] lg:landscape:translate-y-[39%] xl:landscape:translate-y-[39%]"
          >
            {/* flower_green (sisi kiri) */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/flower_green.png"
              alt=""
              className="absolute inset-0 w-full h-full object-contain drop-shadow-[0_8px_24px_rgba(0,0,0,0.45)] will-change-transform"
            />
            {/* flower_green2 (sisi kanan) */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/flower_green2.png"
              alt=""
              className="absolute inset-0 w-full h-full object-contain drop-shadow-[0_8px_24px_rgba(0,0,0,0.45)] will-change-transform"
            />
          </div>

          <p className="text-[14px] sm:text-base landscape:text-[10px] sm:landscape:text-xs md:landscape:text-sm uppercase tracking-[0.3em] sm:tracking-[0.4em] landscape:tracking-[0.25em] md:landscape:tracking-[0.35em] text-gold-300 landscape:-translate-y-1 sm:landscape:-translate-y-1.5 md:landscape:translate-y-0">
            The Wedding of
          </p>

          <h1
            style={{ fontFamily: "var(--font-script)" }}
            className="mt-2 sm:mt-3 landscape:mt-1 sm:landscape:mt-1.5 md:landscape:mt-3 font-script text-4xl xs:text-5xl sm:text-6xl md:text-7xl lg:text-8xl landscape:text-4xl sm:landscape:text-4xl md:landscape:text-5xl lg:landscape:text-6xl text-gold-shimmer leading-normal py-1 px-2 whitespace-nowrap"
          >
            {W.groom.shortName} &amp; {W.bride.shortName}
          </h1>
        </div>

        {/* Ornamen Wayang Gunungan Kiri - Sejajar Nama Rifqi & Gagang Tersembunyi */}
        <div
          aria-hidden
          className="pointer-events-none select-none z-0 absolute top-[calc(50%-4rem)] sm:top-[calc(50%-5rem)] md:top-[calc(50%-6rem)] lg:top-[calc(50%-7rem)] landscape:top-[calc(50%-2.5rem)] sm:landscape:top-[calc(50%-3rem)] md:landscape:top-[calc(50%-5rem)] lg:landscape:top-[calc(50%-6rem)] xl:landscape:top-[calc(50%-7rem)]
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
          className="pointer-events-none select-none z-0 absolute top-[calc(50%-4rem)] sm:top-[calc(50%-5rem)] md:top-[calc(50%-6rem)] lg:top-[calc(50%-7rem)] landscape:top-[calc(50%-2.5rem)] sm:landscape:top-[calc(50%-3rem)] md:landscape:top-[calc(50%-5rem)] lg:landscape:top-[calc(50%-6rem)] xl:landscape:top-[calc(50%-7rem)]
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

        {/* Karakter Animasi Pengantin Naufal & Dilla - Paling Bawah Section */}
        <div
          aria-hidden="true"
          data-reveal
          className="pointer-events-none select-none z-10 absolute bottom-0 left-0 right-0 flex justify-center items-end"
        >
          <div
            className="relative flex items-end justify-center"
            style={{
              WebkitMaskImage: "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.3) 5%, rgba(0,0,0,0.8) 11%, black 16%, black 100%)",
              maskImage: "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.3) 5%, rgba(0,0,0,0.8) 11%, black 16%, black 100%)",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/animated_naufaldilla.webp"
              alt="Ilustrasi Pengantin Rifqi Naufal &amp; Dilla"
              style={{
                WebkitMaskImage: "linear-gradient(to bottom, black 93%, transparent 100%)",
                maskImage: "linear-gradient(to bottom, black 93%, transparent 100%)",
              }}
              className="w-[min(72vw,250px)] sm:w-[300px] md:w-[400px] lg:w-[480px] xl:w-[540px] landscape:w-auto landscape:h-[52dvh] landscape:max-h-[260px] sm:landscape:h-[54dvh] sm:landscape:max-h-[300px] md:landscape:h-[48dvh] md:landscape:max-h-[380px] lg:landscape:h-[50dvh] lg:landscape:max-h-[440px] xl:landscape:h-[52dvh] xl:landscape:max-h-[490px] h-auto object-contain drop-shadow-[0_4px_24px_rgba(0,0,0,0.5)]"
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
            loading="lazy"
            decoding="async"
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
            loading="lazy"
            decoding="async"
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
            loading="lazy"
            decoding="async"
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
            loading="lazy"
            decoding="async"
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
            loading="lazy"
            decoding="async"
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
            loading="lazy"
            decoding="async"
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
            loading="lazy"
            decoding="async"
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
            loading="lazy"
            decoding="async"
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
            loading="lazy"
            decoding="async"
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
            loading="lazy"
            decoding="async"
            className="motive-ornament w-36 sm:w-52 md:w-68 lg:w-80 h-auto object-contain will-change-transform"
          />
        </div>

        <div className="relative z-10 flex flex-col items-center w-full">
          <h2 className="font-display text-4xl md:text-5xl text-gold-shimmer" data-reveal>Waktu &amp; Tempat</h2>
          <Divider />

          {/* Save The Date */}
          <div className="flex flex-col items-center mb-8 w-full max-w-md mx-auto" data-reveal>
            <div className="relative overflow-hidden rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.35)] border border-gold-500/30 max-w-[260px] sm:max-w-[280px] w-full transition-transform duration-300 hover:scale-[1.02]">
              <ShimmerImage
                src="/save_the_date.jpg"
                alt="Save The Date"
                className="w-full h-auto block rounded-2xl"
                containerClassName="w-full"
                loading="lazy"
              />
            </div>
            {/* Tampilan Tanggal Tipografi Minimalis Tanpa Frame (Warna Putih Solid) */}
            <div className="mt-8 flex flex-col items-center justify-center text-center select-none text-white" data-reveal>
              <p className="font-sans text-xs sm:text-sm font-semibold tracking-[0.45em] uppercase text-white/90 pl-[0.45em]">
                {weddingDateParts.dayName}
              </p>
              <span className="font-display text-7xl xs:text-8xl sm:text-9xl font-light text-white leading-none my-1 sm:my-2 drop-shadow-[0_4px_16px_rgba(0,0,0,0.35)]">
                {weddingDateParts.dayNumber}
              </span>
              <p className="font-sans text-xs sm:text-sm font-semibold tracking-[0.4em] uppercase text-white/90 pl-[0.4em] mt-0.5">
                {weddingDateParts.monthName}
              </p>
              <p className="font-sans text-xs sm:text-sm font-semibold tracking-[0.45em] uppercase text-white/80 pl-[0.45em] mt-1.5">
                {weddingDateParts.yearNumber}
              </p>
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
            loading="lazy"
            decoding="async"
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
            loading="lazy"
            decoding="async"
            className="motive-ornament w-32 sm:w-48 md:w-64 lg:w-76 h-auto object-contain will-change-transform"
          />
        </div>

        <div className="relative z-10 flex flex-col items-center w-full">
          <h2 className="font-display text-4xl md:text-5xl text-gold-shimmer" data-reveal>
            Denah Lokasi
          </h2>
          <Divider />

          <div className="mx-auto max-w-6xl w-full space-y-8" data-reveal>
            <div className="grid gap-6 md:grid-cols-[3fr_2fr] items-stretch">
              {/* 1. Denah Lokasi */}
              <div className="glass-card flex flex-col items-center justify-center p-2.5 sm:p-4 md:p-5 h-full">
                {mapImageUrl ? (
                  <ImageModal src={mapImageUrl} alt="Denah lokasi acara" />
                ) : (
                  <div className="w-full h-56 sm:h-64 skeleton-shimmer rounded-xl" />
                )}
              </div>

              {/* 2. Scan QR Code Maps */}
              <div className="glass-card flex flex-col items-center justify-center p-6 h-full bg-emerald-950/20">
                <p className="text-xs uppercase tracking-widest text-gold-300 mb-6 font-semibold">
                  Scan QR Google Maps
                </p>
                <div className="relative p-3 bg-white rounded-2xl shadow-lg border border-gold-500/20 max-w-[200px] md:max-w-[220px] w-full">
                  <ShimmerImage
                    src="/qr-maps.png"
                    alt="Scan QR Google Maps"
                    className="w-full h-auto aspect-square object-contain rounded-lg"
                    containerClassName="w-full aspect-square"
                    shimmerClassName="rounded-lg"
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
                  <div className="h-10 w-44 skeleton-shimmer rounded-full my-1 mx-auto" />
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
            loading="lazy"
            decoding="async"
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
            loading="lazy"
            decoding="async"
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
              <Placeholder label="teks cerita cinta kami dari pemilik" lines={4} card />
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
            loading="lazy"
            decoding="async"
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
            loading="lazy"
            decoding="async"
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
            loading="lazy"
            decoding="async"
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
          {/* Motive 1 - Pojok Kanan Atas (Digeser ke sudut luar agar tidak menabrak teks doa restu) */}
          <div
            aria-hidden="true"
            data-reveal
            className="pointer-events-none select-none absolute -top-8 -right-10 sm:-top-12 sm:-right-16 md:-top-14 md:-right-20 z-0 rotate-15 opacity-60 sm:opacity-75 md:opacity-90"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/motive/motive_1.png"
              alt=""
              loading="lazy"
              decoding="async"
              className="motive-ornament w-32 sm:w-48 md:w-64 lg:w-76 h-auto object-contain will-change-transform"
            />
          </div>

          {/* Motive 4 - Pojok Kiri Bawah (Digeser ke sudut luar agar tidak menabrak elemen kado) */}
          <div
            aria-hidden="true"
            data-reveal
            className="pointer-events-none select-none absolute -bottom-10 -left-10 sm:-bottom-14 sm:-left-16 md:-bottom-16 md:-left-20 z-0 -rotate-12 opacity-60 sm:opacity-75 md:opacity-90"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/motive/motive_4.png"
              alt=""
              loading="lazy"
              decoding="async"
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
            loading="lazy"
            decoding="async"
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
            loading="lazy"
            decoding="async"
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
        </div>

        {/* Footer / Copyright Elegan */}
        <footer
          className="relative z-10 mt-auto pt-6 sm:pt-8 landscape:pt-3 pb-2 sm:pb-4 landscape:pb-1 flex flex-col items-center gap-1 select-none"
          data-reveal
        >
          <div className="h-[1px] w-16 bg-gradient-to-r from-transparent via-gold-400/30 to-transparent mb-1" aria-hidden="true" />
          <p className="text-[9px] landscape:text-[8px] tracking-[0.2em] uppercase text-cream/35 font-light">
            <span className="text-gold-400/60">&copy;</span>
            Copyright 2026 | {W.groom.shortName} - {W.bride.shortName}
          </p>
        </footer>
      </section>

      {/* Floating Scroll To Top Button saat sampai di section penutup */}
      <ScrollToTop targetId="penutup" />
    </InvitationShell>
  );
}