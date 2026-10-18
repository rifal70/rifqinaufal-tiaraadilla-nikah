import Link from "next/link";
import { requireAdmin } from "@/lib/auth/admin";
import { createServiceClient } from "@/lib/supabase/server";
import { STORAGE_BUCKET, getSettings } from "@/lib/data";
import { ActionForm, InviteCreator } from "@/components/admin/Forms";
import {
  logoutAction,
  createInvitationsAction,
  regenerateLinkAction,
  setRevokedAction,
  deleteInvitationAction,
  updateBankAction,
  updateSettingsAction,
  uploadAssetAction,
  uploadGalleryAction,
  toggleGalleryAction,
  deleteGalleryAction,
} from "./actions";

export const dynamic = "force-dynamic";
const PAGE_SIZE = 50;

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireAdmin();
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.slice(0, 100) : "";
  const page = Math.max(1, parseInt(typeof sp.page === "string" ? sp.page : "1", 10) || 1);

  const supabase = createServiceClient();
  let invQuery = supabase
    .from("invitations")
    .select("id, guest_name, guest_count, is_revoked, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (q) invQuery = invQuery.ilike("guest_name", `%${q.replace(/[%_]/g, "\\$&")}%`);

  const [{ data: invites, count }, { data: banks }, { data: photos }, settings, { count: activeSessions }] = await Promise.all([
    invQuery,
    supabase.from("bank_accounts").select("*").order("display_order"),
    supabase.from("gallery_images").select("id, storage_path, is_visible, display_order").order("display_order"),
    getSettings(),
    supabase.from("sessions").select("id", { count: "exact", head: true }).gt("expires_at", new Date().toISOString()),
  ]);

  const { data: thumbs } = photos?.length
    ? await supabase.storage.from(STORAGE_BUCKET).createSignedUrls(photos.map((p) => p.storage_path), 600)
    : { data: [] };
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  return (
    <main className="mx-auto max-w-6xl p-4 md:p-8 space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl text-gold-shimmer">Panel Admin</h1>
          <p className="text-sm text-green-100">{user.email}</p>
        </div>
        <form action={logoutAction}>
          <button type="submit" className="btn-copy" id="logout">Keluar</button>
        </form>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <Stat label="Total undangan" value={count ?? 0} hint={q ? "hasil pencarian" : undefined} />
        <Stat label="Sesi aktif" value={activeSessions ?? 0} />
        <Stat label="Foto galeri" value={photos?.length ?? 0} />
      </section>

      {/* Invitations */}
      <section className="glass-card space-y-6">
        <h2 className="admin-h2">Undangan</h2>
        <InviteCreator action={createInvitationsAction} />

        <form className="flex gap-2" method="get" id="search-invites">
          <input name="q" defaultValue={q} placeholder="Cari nama tamu…" className="admin-input" id="search-q" />
          <button type="submit" className="btn-copy" id="search-submit">Cari</button>
        </form>

        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr><th>Nama</th><th>Jml</th><th>Status</th><th>Aksi</th></tr>
            </thead>
            <tbody>
              {invites?.map((inv) => (
                <tr key={inv.id}>
                  <td>{inv.guest_name}</td>
                  <td>{inv.guest_count}</td>
                  <td>{inv.is_revoked ? <span className="text-red-300">Dicabut</span> : <span className="text-green-200">Aktif</span>}</td>
                  <td className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      <form action={setRevokedAction}>
                        <input type="hidden" name="id" value={inv.id} />
                        <input type="hidden" name="revoke" value={inv.is_revoked ? "0" : "1"} />
                        <button className="btn-copy" type="submit" id={`revoke-${inv.id}`}>{inv.is_revoked ? "Aktifkan" : "Cabut"}</button>
                      </form>
                      <form action={deleteInvitationAction}>
                        <input type="hidden" name="id" value={inv.id} />
                        <button className="btn-copy" type="submit" id={`delete-${inv.id}`}>Hapus</button>
                      </form>
                    </div>
                    <ActionForm action={regenerateLinkAction} submitLabel="Link baru" id={`regen-${inv.id}`}>
                      <input type="hidden" name="id" value={inv.id} />
                    </ActionForm>
                  </td>
                </tr>
              ))}
              {!invites?.length && (
                <tr><td colSpan={4} className="text-center text-green-100">Belum ada undangan.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <nav className="flex items-center gap-3 text-sm">
          {page > 1 && <Link className="btn-copy" href={`/admin?q=${encodeURIComponent(q)}&page=${page - 1}`}>← Sebelumnya</Link>}
          <span>Halaman {page} / {totalPages}</span>
          {page < totalPages && <Link className="btn-copy" href={`/admin?q=${encodeURIComponent(q)}&page=${page + 1}`}>Berikutnya →</Link>}
        </nav>
      </section>

      {/* Content settings */}
      <section className="glass-card space-y-4">
        <h2 className="admin-h2">Konten dari Pemilik</h2>
        <p className="text-sm text-green-100">Tempel teks persis seperti di undangan. Kosongkan untuk menampilkan placeholder.</p>
        <form action={updateSettingsAction} id="settings-form" className="space-y-3">
          <label className="admin-label" htmlFor="opening_greeting">Salam pembuka</label>
          <textarea id="opening_greeting" name="opening_greeting" rows={5} className="admin-input" defaultValue={settings.opening_greeting} />
          <label className="admin-label" htmlFor="closing_greeting">Salam penutup</label>
          <textarea id="closing_greeting" name="closing_greeting" rows={5} className="admin-input" defaultValue={settings.closing_greeting} />
          <label className="admin-label" htmlFor="maps_url">Link Google Maps (https://…)</label>
          <input id="maps_url" name="maps_url" type="url" className="admin-input" defaultValue={settings.maps_url} />
          <button type="submit" className="btn-gold" id="settings-submit">Simpan</button>
        </form>
        <div className="grid gap-6 md:grid-cols-2">
          <ActionForm action={uploadAssetAction} submitLabel="Unggah Denah Lokasi" id="upload-map">
            <input type="hidden" name="kind" value="map" />
            <label className="admin-label" htmlFor="map-file">Gambar Denah Lokasi (JPG/PNG/WebP, ≤5 MB) {settings.map_image_path ? "✓ sudah ada" : ""}</label>
            <input id="map-file" name="file" type="file" accept="image/jpeg,image/png,image/webp,image/avif" required className="admin-input" />
          </ActionForm>
          <ActionForm action={uploadAssetAction} submitLabel="Unggah Musik" id="upload-music">
            <input type="hidden" name="kind" value="music" />
            <label className="admin-label" htmlFor="music-file">Musik latar (MP3/M4A/OGG, ≤5 MB) {settings.music_path ? "✓ sudah ada" : ""}</label>
            <input id="music-file" name="file" type="file" accept="audio/*" required className="admin-input" />
          </ActionForm>
        </div>
      </section>

      {/* Banks */}
      <section className="glass-card space-y-4">
        <h2 className="admin-h2">Rekening (Amplop Digital)</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {banks?.map((b) => (
            <form key={b.id} action={updateBankAction} className="rounded-xl border border-gold-500/20 p-4 space-y-2" id={`bank-form-${b.display_order}`}>
              <input type="hidden" name="id" value={b.id} />
              <p className="text-xs text-gold-300">Urutan #{b.display_order}</p>
              <input name="bank_name" defaultValue={b.bank_name} className="admin-input" aria-label="Nama bank" />
              <input name="account_holder" defaultValue={b.account_holder} className="admin-input" aria-label="Atas nama" />
              <input name="account_number" defaultValue={b.account_number} className="admin-input font-mono" aria-label="Nomor rekening" inputMode="text" />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="is_enabled" defaultChecked={b.is_enabled} /> Tampilkan
              </label>
              <button type="submit" className="btn-copy" id={`bank-save-${b.display_order}`}>Simpan</button>
            </form>
          ))}
        </div>
      </section>

      {/* Gallery */}
      <section className="glass-card space-y-4">
        <h2 className="admin-h2">Galeri</h2>
        <ActionForm action={uploadGalleryAction} submitLabel="Unggah Foto" id="upload-gallery">
          <label className="admin-label" htmlFor="gallery-files">Foto (JPG/PNG/WebP, maks 5 MB per unggahan — pilih beberapa sekaligus bila kecil)</label>
          <input id="gallery-files" name="files" type="file" multiple accept="image/jpeg,image/png,image/webp,image/avif" required className="admin-input" />
        </ActionForm>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {photos?.map((p, i) => (
            <div key={p.id} className={`rounded-lg overflow-hidden border border-gold-500/20 ${p.is_visible ? "" : "opacity-40"}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={thumbs?.[i]?.signedUrl ?? ""} alt="" className="aspect-square w-full object-cover" loading="lazy" />
              <div className="flex gap-1 p-2">
                <form action={toggleGalleryAction}>
                  <input type="hidden" name="id" value={p.id} />
                  <input type="hidden" name="visible" value={p.is_visible ? "0" : "1"} />
                  <button className="btn-copy" type="submit">{p.is_visible ? "Sembunyikan" : "Tampilkan"}</button>
                </form>
                <form action={deleteGalleryAction}>
                  <input type="hidden" name="id" value={p.id} />
                  <button className="btn-copy" type="submit">Hapus</button>
                </form>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

function Stat({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <div className="glass-card-gold">
      <p className="text-xs uppercase tracking-widest text-gold-300">{label}</p>
      <p className="mt-2 font-display text-4xl text-cream">{value}</p>
      {hint && <p className="text-xs text-green-100">{hint}</p>}
    </div>
  );
}
