import Link from "next/link";
import { requireAdmin } from "@/lib/auth/admin";
import { query } from "@/lib/neon/db";
import { getSettings } from "@/lib/data";
import { getMediaUrl } from "@/lib/media";
import { LOVE_STORY, DIGITAL_GIFT_DEFAULT_TEXT } from "@/lib/content";
import {
  ActionForm,
  InviteCreator,
  AdminForm,
  AdminSubmitButton,
  CopyableLinkInput,
  FileUploadWithPreview,
  GalleryUploadWithPreview,
} from "@/components/admin/Forms";
import { ToastProvider } from "@/components/admin/ToastContext";
import {
  logoutAction,
  createInvitationsAction,
  regenerateLinkAction,
  setRevokedAction,
  deleteInvitationAction,
  updateBankAction,
  updateSettingsAction,
  uploadAssetAction,
  deleteAssetAction,
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

  // Periksa ketersediaan kolom token di database secara aman
  let hasTokenColumn = false;
  try {
    const colRows = await query<{ column_name: string }>(
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'invitations' AND column_name = 'token'"
    );
    hasTokenColumn = colRows && colRows.length > 0;
    if (!hasTokenColumn) {
      await query("ALTER TABLE invitations ADD COLUMN IF NOT EXISTS token TEXT");
      hasTokenColumn = true;
    }
  } catch (err) {
    console.warn("Notice: token column check or creation:", err);
    hasTokenColumn = false;
  }

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");
  const offset = (page - 1) * PAGE_SIZE;
  const countParams: any[] = [];
  const invParams: any[] = [];

  let countSql = "SELECT COUNT(*) AS total FROM invitations";
  // Gunakan NULL AS token jika kolom token belum ada di database, agar SQL tidak pernah gagal
  let invSql = `
    SELECT id, guest_name, guest_count, is_revoked, visible_bank_ids,
           ${hasTokenColumn ? "token" : "NULL AS token"},
           created_at
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

  const [
    thumbs,
    groomPhotoUrl,
    bridePhotoUrl,
    mapImageUrl,
    musicUrl,
  ] = await Promise.all([
    Promise.all(
      (photos ?? []).map(async (p) => ({
        signedUrl: await getMediaUrl(p.storage_path),
      }))
    ),
    settings.groom_photo_path?.trim() ? getMediaUrl(settings.groom_photo_path) : Promise.resolve(""),
    settings.bride_photo_path?.trim() ? getMediaUrl(settings.bride_photo_path) : Promise.resolve(""),
    settings.map_image_path?.trim() ? getMediaUrl(settings.map_image_path) : Promise.resolve(""),
    settings.music_path?.trim() ? getMediaUrl(settings.music_path) : Promise.resolve(""),
  ]);

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
              <AdminForm
                key={b.id}
                actionFn={updateBankAction}
                className="rounded-xl border border-gold-500/20 p-4 space-y-2"
                id={`bank-form-${b.display_order}`}
                successMessage={`Rekening ${b.bank_name || "bank"} berhasil disimpan!`}
                errorMessage={`Gagal menyimpan rekening ${b.bank_name || "bank"}.`}
              >
                <input type="hidden" name="id" value={b.id} />
                <p className="text-xs text-gold-300">Urutan #{b.display_order}</p>
                <input name="bank_name" defaultValue={b.bank_name} className="admin-input" aria-label="Nama bank" />
                <input name="account_holder" defaultValue={b.account_holder} className="admin-input" aria-label="Atas nama" />
                <input name="account_number" defaultValue={b.account_number} className="admin-input font-mono" aria-label="Nomor rekening" inputMode="text" />
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="is_enabled" defaultChecked={b.is_enabled} /> Aktif
                </label>
                <AdminSubmitButton id={`bank-save-${b.display_order}`}>
                  Simpan
                </AdminSubmitButton>
              </AdminForm>
            ))}
          </div>
        </section>

        {/* Invitations */}
        <section className="glass-card space-y-6">
          <h2 className="admin-h2">Undangan</h2>

          <div className="rounded-xl border border-gold-500/20 p-4 space-y-4">
            <h3 className="text-lg font-medium text-gold-200">Buat Undangan Baru</h3>
            <InviteCreator
              actionFn={createInvitationsAction}
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
                  <th className="py-2.5 px-2">Nama</th>
                  <th className="py-2.5 px-2">Pax</th>
                  <th className="py-2.5 px-2">Link Undangan</th>
                  <th className="py-2.5 px-2">Rekening Terlihat</th>
                  <th className="py-2.5 px-2">Status</th>
                  <th className="py-2.5 px-2 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gold-500/10">
                {invites?.map((inv) => {
                  const inviteUrl = inv.token ? `${siteUrl}/invite/${inv.token}` : null;
                  return (
                    <tr key={inv.id} className="hover:bg-gold-500/5 transition-colors">
                      <td className="py-3 px-2 font-medium text-cream whitespace-nowrap">{inv.guest_name}</td>
                      <td className="py-3 px-2">{inv.guest_count}</td>
                      <td className="py-3 px-2">
                        <CopyableLinkInput
                          initialUrl={inviteUrl}
                          invitationId={inv.id}
                        />
                      </td>
                      <td className="py-3 px-2 text-xs text-cream/80">
                        <AdminForm
                          actionFn={updateInvitationBanksAction}
                          className="flex flex-col gap-1.5 max-w-xs"
                          successMessage={`Pengaturan amplop untuk ${inv.guest_name} disimpan!`}
                          errorMessage={`Gagal menyimpan amplop untuk ${inv.guest_name}.`}
                        >
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
                          <AdminSubmitButton className="text-[10px] py-0.5 px-2 self-start btn-copy">
                            Simpan Amplop
                          </AdminSubmitButton>
                        </AdminForm>
                      </td>
                      <td className="py-3 px-2">
                        {inv.is_revoked ? (
                          <span className="text-red-300">Dicabut</span>
                        ) : (
                          <span className="text-green-300">Aktif</span>
                        )}
                      </td>
                      <td className="py-3 px-2 text-right">
                        <div className="inline-flex items-center gap-2">
                          <AdminForm
                            actionFn={setRevokedAction}
                            successMessage={inv.is_revoked ? "Undangan diaktifkan kembali!" : "Undangan berhasil dicabut!"}
                            errorMessage="Gagal mengubah status undangan."
                          >
                            <input type="hidden" name="id" value={inv.id} />
                            <input type="hidden" name="revoke" value={inv.is_revoked ? "0" : "1"} />
                            <AdminSubmitButton id={`revoke-${inv.id}`}>
                              {inv.is_revoked ? "Aktifkan" : "Cabut"}
                            </AdminSubmitButton>
                          </AdminForm>
                          <AdminForm
                            actionFn={deleteInvitationAction}
                            successMessage="Undangan berhasil dihapus!"
                            errorMessage="Gagal menghapus undangan."
                          >
                            <input type="hidden" name="id" value={inv.id} />
                            <AdminSubmitButton id={`del-${inv.id}`}>
                              Hapus
                            </AdminSubmitButton>
                          </AdminForm>
                        </div>
                      </td>
                    </tr>
                  );
                })}
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

          <AdminForm
            actionFn={updateSettingsAction}
            className="space-y-4"
            id="settings-form"
            successMessage="Pengaturan teks acara berhasil disimpan!"
            errorMessage="Gagal menyimpan pengaturan teks acara."
          >
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

            <AdminSubmitButton id="save-settings">
              Simpan Pengaturan
            </AdminSubmitButton>
          </AdminForm>

          <div className="grid gap-4 md:grid-cols-2 pt-4 border-t border-gold-500/20">
            <FileUploadWithPreview
              actionFn={uploadAssetAction}
              deleteActionFn={deleteAssetAction}
              kind="groom_photo"
              label="Foto Mempelai Pria"
              accept="image/jpeg,image/png,image/webp,image/avif"
              submitLabel="Unggah Foto Pria"
              currentUrl={groomPhotoUrl}
              id="upload-groom"
              hint="Format JPG/PNG/WebP, maksimal 255 KB"
            />

            <FileUploadWithPreview
              actionFn={uploadAssetAction}
              deleteActionFn={deleteAssetAction}
              kind="bride_photo"
              label="Foto Mempelai Wanita"
              accept="image/jpeg,image/png,image/webp,image/avif"
              submitLabel="Unggah Foto Wanita"
              currentUrl={bridePhotoUrl}
              id="upload-bride"
              hint="Format JPG/PNG/WebP, maksimal 255 KB"
            />

            <FileUploadWithPreview
              actionFn={uploadAssetAction}
              deleteActionFn={deleteAssetAction}
              kind="map"
              label="Gambar Denah Lokasi"
              accept="image/jpeg,image/png,image/webp,image/avif"
              submitLabel="Unggah Denah Lokasi"
              currentUrl={mapImageUrl}
              id="upload-map"
              hint="Format JPG/PNG/WebP, maksimal 255 KB"
            />

            <FileUploadWithPreview
              actionFn={uploadAssetAction}
              deleteActionFn={deleteAssetAction}
              kind="music"
              label="Musik Latar Acara"
              accept="audio/*"
              submitLabel="Unggah Musik"
              currentUrl={musicUrl}
              id="upload-music"
              isAudio={true}
              hint="Format MP3/M4A/OGG, maksimal 1.2 MB"
            />
          </div>
        </section>

        {/* Gallery */}
        <section className="glass-card space-y-4">
          <h2 className="admin-h2">Galeri</h2>
          <GalleryUploadWithPreview actionFn={uploadGalleryAction} />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {photos?.map((p, i) => (
              <div key={p.id} className={`rounded-lg overflow-hidden border border-gold-500/20 ${p.is_visible ? "" : "opacity-40"}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={thumbs?.[i]?.signedUrl ?? ""} alt="" className="aspect-square w-full object-cover" loading="lazy" />
                <div className="flex gap-1 p-2">
                  <AdminForm
                    actionFn={toggleGalleryAction}
                    successMessage={p.is_visible ? "Foto galeri disembunyikan!" : "Foto galeri ditampilkan!"}
                    errorMessage="Gagal mengubah status foto."
                  >
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="visible" value={p.is_visible ? "0" : "1"} />
                    <AdminSubmitButton>
                      {p.is_visible ? "Sembunyikan" : "Tampilkan"}
                    </AdminSubmitButton>
                  </AdminForm>
                  <AdminForm
                    actionFn={deleteGalleryAction}
                    successMessage="Foto berhasil dihapus!"
                    errorMessage="Gagal menghapus foto."
                  >
                    <input type="hidden" name="id" value={p.id} />
                    <AdminSubmitButton>
                      Hapus
                    </AdminSubmitButton>
                  </AdminForm>
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