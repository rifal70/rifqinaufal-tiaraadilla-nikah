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
        <div className="grid gap-10 md:grid-cols-[1fr_auto_1fr] items-center max-w-5xl w-full">
          {[W.groom, W.bride].map((p, i) => (
            <div key={p.name} className={`glass-card ${i === 1 ? "md:order-3" : ""}`} data-reveal>
              <h3 className="font-display text-3xl md:text-4xl text-gold-shimmer">{p.name}</h3>
              <p className="mt-4 text-sm text-green-100">{p.childOrder}</p>
              <p className="mt-1 text-cream">{p.father}</p>
              <p className="text-cream">dan {p.mother}</p>
            </div>
          ))}
          <span className="font-display text-6xl text-gold-400 md:order-2" data-reveal>&amp;</span>
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
        <h2 className="font-display text-4xl md:text-5xl text-gold-shimmer" data-reveal>Denah Lokasi</h2>
        <Divider />
        <div className="max-w-3xl w-full" data-reveal>
          {mapImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={mapImageUrl} alt="Denah lokasi acara" className="rounded-xl w-full" loading="lazy" />
          ) : (
            <Placeholder label="gambar Denah Lokasi" />
          )}
          {settings.maps_url ? (
            <a id="maps-link" href={settings.maps_url} target="_blank" rel="noopener noreferrer" className="btn-gold inline-block mt-6">
              Buka di Google Maps
            </a>
          ) : (
            <Placeholder label="tautan Google Maps" />
          )}
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

      {/* Gifts */}
      <section className="section-wedding text-center" id="amplop">
        <h2 className="font-display text-4xl md:text-5xl text-gold-shimmer" data-reveal>Amplop Digital</h2>
        <Divider />
        <div className="grid gap-6 md:grid-cols-3 max-w-5xl w-full">
          {banks.map((b) => (
            <div key={b.id} data-reveal>
              <BankCard account={b} />
            </div>
          ))}
        </div>
      </section>

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
