import Link from "next/link";
import { requireAdmin } from "@/lib/auth/admin";
import { query } from "@/lib/neon/db";
import { getSettings } from "@/lib/data";
import { getMediaUrl } from "@/lib/media";
import { LOVE_STORY, DIGITAL_GIFT_DEFAULT_TEXT } from "@/lib/content";
import { ActionForm, InviteCreator } from "@/components/admin/Forms";
import { ToastProvider, ToastSubmitButton } from "@/components/admin/ToastContext";
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
  updateInvitationBanksAction,
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

  const offset = (page - 1) * PAGE_SIZE;
  const countParams: any[] = [];
  const invParams: any[] = [];

  let countSql = "SELECT COUNT(*) AS total FROM invitations";
  let invSql = `
    SELECT id, guest_name, guest_count, is_revoked, visible_bank_ids, created_at
    FROM invitations
  `;

  if (q) {
    countSql += " WHERE guest_name ILIKE $1";
    countParams.push(`%${q}%`);
    invSql += " WHERE guest_name ILIKE $1";
    invParams.push(`%${q}%`);
  }

  invSql += ` ORDER BY created_at DESC LIMIT ${PAGE_SIZE} OFFSET ${offset}`;

  const [
    invites,
    countRows,
    banks,
    photos,
    settings,
    activeSessionsRows,
  ] = await Promise.all([
    query<any>(invSql, invParams),
    query<{ total: string }>(countSql, countParams),
    query<any>("SELECT * FROM bank_accounts ORDER BY display_order ASC"),
    query<any>("SELECT id, storage_path, is_visible, display_order FROM gallery_images ORDER BY display_order ASC"),
    getSettings(),
    query<{ total: string }>("SELECT COUNT(*) AS total FROM sessions WHERE expires_at > now()"),
  ]);

  const count = parseInt(countRows[0]?.total ?? "0", 10);
  const activeSessions = parseInt(activeSessionsRows[0]?.total ?? "0", 10);

  const thumbs = await Promise.all(
    (photos ?? []).map(async (p) => ({
      signedUrl: await getMediaUrl(p.storage_path),
    }))
  );

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  const availableBanks =
    banks?.filter((b) => {
      const name = b.bank_name?.trim();
      const num = b.account_number?.trim();
      return Boolean(name && name !== "-" && num && num !== "-");
    }) ?? [];

  return (
    <ToastProvider>
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

        {/* Banks (Master Data) */}
        <section className="glass-card space-y-4">
          <h2 className="admin-h2">Master Rekening Bank</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {banks?.map((b) => (
              <form key={b.id} action={updateBankAction} className="rounded-xl border border-gold-500/20 p-4 space-y-2" id={`bank-form-${b.display_order}`}>
                <input type="hidden" name="id" value={b.id} />
                <p className="text-xs text-gold-300">Urutan #{b.display_order}</p>
                <input name="bank_name" defaultValue={b.bank_name} className="admin-input" aria-label="Nama bank" />
                <input name="account_holder" defaultValue={b.account_holder} className="admin-input" aria-label="Atas nama" />
                <input name="account_number" defaultValue={b.account_number} className="admin-input font-mono" aria-label="Nomor rekening" inputMode="text" />
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="is_enabled" defaultChecked={b.is_enabled} /> Aktif
                </label>
                <ToastSubmitButton
                  id={`bank-save-${b.display_order}`}
                  successMessage={`Rekening ${b.bank_name || "bank"} berhasil disimpan!`}
                >
                  Simpan
                </ToastSubmitButton>
              </form>
            ))}
          </div>
        </section>

        {/* Invitations */}
        <section className="glass-card space-y-6">
          <h2 className="admin-h2">Undangan</h2>

          <div className="rounded-xl border border-gold-500/20 p-4 space-y-4">
            <h3 className="text-lg font-medium text-gold-200">Buat Undangan Baru</h3>
            <InviteCreator
              action={createInvitationsAction}
            />
          </div>

          <form method="get" className="flex gap-2">
            <input
              name="q"
              defaultValue={q}
              placeholder="Cari nama tamu…"
              className="admin-input"
              aria-label="Cari nama tamu"
            />
            <button type="submit" className="btn-copy">Cari</button>
            {q && (
              <Link href="/admin" className="btn-copy self-center text-xs">
                Reset
              </Link>
            )}
          </form>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm" id="invitations-table">
              <thead className="border-b border-gold-500/20 text-xs uppercase tracking-wider text-gold-300">
                <tr>
                  <th className="py-2">Nama</th>
                  <th className="py-2">Pax</th>
                  <th className="py-2">Rekening Terlihat</th>
                  <th className="py-2">Status</th>
                  <th className="py-2 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gold-500/10">
                {invites?.map((inv) => (
                  <tr key={inv.id}>
                    <td className="py-3 font-medium text-cream">{inv.guest_name}</td>
                    <td className="py-3">{inv.guest_count}</td>
                    <td className="py-3 text-xs text-cream/80">
                      <form action={updateInvitationBanksAction} className="flex flex-col gap-1.5 max-w-xs">
                        <input type="hidden" name="invitation_id" value={inv.id} />
                        <div className="flex flex-wrap gap-2 text-[11px]">
                          {availableBanks.map((b) => {
                            const isChecked = !inv.visible_bank_ids || inv.visible_bank_ids.includes(b.id);
                            return (
                              <label key={b.id} className="flex items-center gap-1 bg-forest-900/40 px-1.5 py-0.5 rounded border border-gold-500/20 cursor-pointer">
                                <input
                                  type="checkbox"
                                  name="bank_ids"
                                  value={b.id}
                                  defaultChecked={isChecked}
                                  className="rounded border-gold-500/30 text-gold-500 focus:ring-0"
                                />
                                <span>{b.bank_name}</span>
                              </label>
                            );
                          })}
                        </div>
                        <ToastSubmitButton
                          className="text-[10px] py-0.5 px-2 self-start btn-copy"
                          successMessage={`Pengaturan amplop untuk ${inv.guest_name} disimpan!`}
                        >
                          Simpan Amplop
                        </ToastSubmitButton>
                      </form>
                    </td>
                    <td className="py-3">
                      {inv.is_revoked ? (
                        <span className="text-red-300">Dicabut</span>
                      ) : (
                        <span className="text-green-300">Aktif</span>
                      )}
                    </td>
                    <td className="py-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        <ActionForm
                          action={regenerateLinkAction}
                          submitLabel="Link baru"
                          id={`regen-${inv.id}`}
                        >
                          <input type="hidden" name="id" value={inv.id} />
                        </ActionForm>
                        <form action={setRevokedAction}>
                          <input type="hidden" name="id" value={inv.id} />
                          <input type="hidden" name="revoke" value={inv.is_revoked ? "0" : "1"} />
                          <ToastSubmitButton
                            id={`revoke-${inv.id}`}
                            successMessage={inv.is_revoked ? "Undangan diaktifkan kembali!" : "Undangan berhasil dicabut!"}
                          >
                            {inv.is_revoked ? "Aktifkan" : "Cabut"}
                          </ToastSubmitButton>
                        </form>
                        <form action={deleteInvitationAction}>
                          <input type="hidden" name="id" value={inv.id} />
                          <ToastSubmitButton
                            id={`del-${inv.id}`}
                            successMessage="Undangan berhasil dihapus!"
                          >
                            Hapus
                          </ToastSubmitButton>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <nav className="flex justify-between items-center text-sm pt-4" aria-label="Pagination">
              <span>Halaman {page} dari {totalPages}</span>
              <div className="flex gap-2">
                {page > 1 && (
                  <Link href={`/admin?${new URLSearchParams({ ...(q && { q }), page: String(page - 1) })}`} className="btn-copy">
                    Sebelumnya
                  </Link>
                )}
                {page < totalPages && (
                  <Link href={`/admin?${new URLSearchParams({ ...(q && { q }), page: String(page + 1) })}`} className="btn-copy">
                    Selanjutnya
                  </Link>
                )}
              </div>
            </nav>
          )}
        </section>

        {/* Content & Assets */}
        <section className="glass-card space-y-6">
          <h2 className="admin-h2">Teks & Aset Acara</h2>

          <form action={updateSettingsAction} className="space-y-4" id="settings-form">
            <div>
              <label className="admin-label" htmlFor="event_date">Tanggal Acara Utama (Akad & Resepsi)</label>
              <input
                id="event_date"
                name="event_date"
                type="date"
                defaultValue={settings.event_date || "2026-12-29"}
                className="admin-input"
              />
              <p className="text-xs text-green-100 mt-1">Mengubah tanggal yang tertera di seluruh kartu, countdown timer, dan kalender.</p>
            </div>

            <div>
              <label className="admin-label" htmlFor="event_expiry_days">Masa Berlaku Link Undangan Setelah Hari Acara (Hari)</label>
              <input
                id="event_expiry_days"
                name="event_expiry_days"
                type="number"
                min="0"
                max="365"
                defaultValue={settings.event_expiry_days || "30"}
                className="admin-input"
              />
              <p className="text-xs text-green-100 mt-1">Link undangan akan otomatis kedaluwarsa X hari setelah tanggal acara utama.</p>
            </div>

            <div>
              <label className="admin-label" htmlFor="opening_greeting">Salam Pembuka</label>
              <textarea
                id="opening_greeting"
                name="opening_greeting"
                rows={3}
                defaultValue={settings.opening_greeting}
                className="admin-input"
              />
            </div>

            <div>
              <label className="admin-label" htmlFor="closing_greeting">Salam Penutup</label>
              <textarea
                id="closing_greeting"
                name="closing_greeting"
                rows={3}
                defaultValue={settings.closing_greeting}
                className="admin-input"
              />
            </div>

            <div>
              <label className="admin-label" htmlFor="love_story">Cerita Cinta</label>
              <textarea
                id="love_story"
                name="love_story"
                rows={5}
                defaultValue={settings.love_story || LOVE_STORY.story}
                className="admin-input"
              />
            </div>

            <div>
              <label className="admin-label" htmlFor="digital_gift_text">Teks Kado Digital / Amplop</label>
              <textarea
                id="digital_gift_text"
                name="digital_gift_text"
                rows={3}
                defaultValue={settings.digital_gift_text || DIGITAL_GIFT_DEFAULT_TEXT}
                className="admin-input"
              />
            </div>

            <div>
              <label className="admin-label" htmlFor="maps_url">URL Google Maps (harus https://)</label>
              <input
                id="maps_url"
                name="maps_url"
                type="url"
                defaultValue={settings.maps_url}
                placeholder="https://maps.google.com/..."
                className="admin-input"
              />
            </div>

            <ToastSubmitButton id="save-settings" successMessage="Pengaturan teks acara berhasil disimpan!">
              Simpan Pengaturan
            </ToastSubmitButton>
          </form>

          <div className="grid gap-4 md:grid-cols-2 pt-4 border-t border-gold-500/20">
            <ActionForm action={uploadAssetAction} submitLabel="Unggah Foto Pria" id="upload-groom">
              <input type="hidden" name="kind" value="groom_photo" />
              <label className="admin-label" htmlFor="groom-file">
                Foto Mempelai Pria (JPG/PNG/WebP, ≤255 KB) {settings.groom_photo_path ? "✓ sudah ada" : ""}
              </label>
              <input id="groom-file" name="file" type="file" accept="image/jpeg,image/png,image/webp,image/avif" required className="admin-input" />
            </ActionForm>

            <ActionForm action={uploadAssetAction} submitLabel="Unggah Foto Wanita" id="upload-bride">
              <input type="hidden" name="kind" value="bride_photo" />
              <label className="admin-label" htmlFor="bride-file">
                Foto Mempelai Wanita (JPG/PNG/WebP, ≤255 KB) {settings.bride_photo_path ? "✓ sudah ada" : ""}
              </label>
              <input id="bride-file" name="file" type="file" accept="image/jpeg,image/png,image/webp,image/avif" required className="admin-input" />
            </ActionForm>

            <ActionForm action={uploadAssetAction} submitLabel="Unggah Denah Lokasi" id="upload-map">
              <input type="hidden" name="kind" value="map" />
              <label className="admin-label" htmlFor="map-file">Gambar Denah Lokasi (JPG/PNG/WebP, ≤255 KB) {settings.map_image_path ? "✓ sudah ada" : ""}</label>
              <input id="map-file" name="file" type="file" accept="image/jpeg,image/png,image/webp,image/avif" required className="admin-input" />
            </ActionForm>

            <ActionForm action={uploadAssetAction} submitLabel="Unggah Musik" id="upload-music">
              <input type="hidden" name="kind" value="music" />
              <label className="admin-label" htmlFor="music-file">Musik latar (MP3/M4A/OGG, ≤1.2 MB) {settings.music_path ? "✓ sudah ada" : ""}</label>
              <input id="music-file" name="file" type="file" accept="audio/*" required className="admin-input" />
            </ActionForm>
          </div>
        </section>

        {/* Gallery */}
        <section className="glass-card space-y-4">
          <h2 className="admin-h2">Galeri</h2>
          <ActionForm action={uploadGalleryAction} submitLabel="Unggah Foto" id="upload-gallery">
            <label className="admin-label" htmlFor="gallery-files">Foto (JPG/PNG/WebP, maks 255 KB per unggahan — pilih beberapa sekaligus bila kecil)</label>
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
                    <ToastSubmitButton successMessage="Visibilitas foto diperbarui!">
                      {p.is_visible ? "Sembunyikan" : "Tampilkan"}
                    </ToastSubmitButton>
                  </form>
                  <form action={deleteGalleryAction}>
                    <input type="hidden" name="id" value={p.id} />
                    <ToastSubmitButton successMessage="Foto berhasil dihapus!">
                      Hapus
                    </ToastSubmitButton>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </ToastProvider>
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