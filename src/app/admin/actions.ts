"use server";

import crypto from "crypto";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import {
  requireAdmin,
  verifyAdminCredentials,
  createAdminSession,
  destroyAdminSession,
} from "@/lib/auth/admin";
import { query } from "@/lib/neon/db";
import { generateToken, hashToken } from "@/lib/auth/session";
import { isAllowed, clientIp } from "@/lib/rate-limit";
import { saveMediaFile, deleteMediaFile } from "@/lib/media";
import { CACHE_TAG_SETTINGS, CACHE_TAG_BANKS, CACHE_TAG_GALLERY } from "@/lib/data";

export type CreatedInvite = {
  name: string;
  count: number;
  token: string;
  url: string;
};

export type ActionState = {
  ok?: boolean;
  error?: string;
  message?: string;
  csv?: string;
  createdInvites?: CreatedInvite[];
};

const siteUrl = () => (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");

/* ---------------- Auth ---------------- */

export async function loginAction(_: ActionState, form: FormData): Promise<ActionState> {
  try {
    const h = await headers();
    if (!(await isAllowed("admin-login", clientIp(h), 5, 300))) {
      return { ok: false, error: "Terlalu banyak percobaan. Coba lagi nanti." };
    }
    const parsed = z
      .object({ email: z.string().email(), password: z.string().min(1) })
      .safeParse({ email: form.get("email"), password: form.get("password") });
    if (!parsed.success) return { ok: false, error: "Email atau kata sandi salah." };

    const valid = await verifyAdminCredentials(parsed.data.email, parsed.data.password);
    if (!valid) {
      return { ok: false, error: "Email atau kata sandi salah." };
    }

    await createAdminSession(parsed.data.email);
  } catch (err: any) {
    console.error("loginAction error:", err);
    return { ok: false, error: err?.message || "Terjadi kesalahan saat masuk." };
  }
  redirect("/admin");
}

export async function logoutAction() {
  await destroyAdminSession();
  redirect("/admin/login");
}

/* ---------------- Invitations ---------------- */

/** Bulk create: one guest name per line, optional ";count;bankRef". */
export async function createInvitationsAction(formData: FormData): Promise<ActionState> {
  try {
    await requireAdmin();

    const rawGuests = formData.get("guests")?.toString() ?? "";
    const lines = rawGuests
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    if (!lines.length) return { ok: false, error: "Daftar tamu tidak boleh kosong." };

    // Check if token column exists in database
    let hasTokenCol = false;
    try {
      const colRows = await query<{ column_name: string }>(
        "SELECT column_name FROM information_schema.columns WHERE table_name = 'invitations' AND column_name = 'token'"
      );
      hasTokenCol = colRows && colRows.length > 0;
      if (!hasTokenCol) {
        await query("ALTER TABLE invitations ADD COLUMN IF NOT EXISTS token TEXT");
        hasTokenCol = true;
      }
    } catch {
      hasTokenCol = false;
    }

    // 1. Ambil data master rekening aktif untuk pemetaan urutan -> ID
    const activeBankList = await query<{
      id: string;
      display_order: number;
      account_number: string;
    }>("SELECT id, display_order, account_number FROM bank_accounts WHERE is_enabled = true");

    const base = siteUrl();
    const createdInvites: CreatedInvite[] = [];

    // 2. Parse tiap baris: nama;jumlah;norek_atau_urutan
    for (const line of lines) {
      const parts = line.split(";").map((s) => s.trim());
      const name = parts[0] || "Tamu";
      const count = Math.max(1, parseInt(parts[1] || "1", 10) || 1);
      const bankRef = parts[2]?.toLowerCase();

      let matchedBankIds: string[] | null = null;

      if (!bankRef || bankRef === "all") {
        matchedBankIds = activeBankList.map((b) => b.id);
      } else if (bankRef === "none" || bankRef === "0" || bankRef === "-") {
        matchedBankIds = [];
      } else {
        const targets = bankRef.split(",").map((t) => t.trim());
        matchedBankIds = activeBankList
          .filter(
            (b) =>
              targets.includes(String(b.display_order)) ||
              targets.includes(b.account_number)
          )
          .map((b) => b.id);
      }

      const token = generateToken();
      const tokenHash = hashToken(token);

      if (hasTokenCol) {
        await query(
          `INSERT INTO invitations (guest_name, token_hash, guest_count, visible_bank_ids, token)
           VALUES ($1, $2, $3, $4, $5)`,
          [name, tokenHash, count, matchedBankIds, token]
        );
      } else {
        await query(
          `INSERT INTO invitations (guest_name, token_hash, guest_count, visible_bank_ids)
           VALUES ($1, $2, $3, $4)`,
          [name, tokenHash, count, matchedBankIds]
        );
      }

      createdInvites.push({
        name,
        count,
        token,
        url: `${base}/invite/${token}`,
      });
    }

    revalidatePath("/admin");
    return {
      ok: true,
      message: `${lines.length} undangan berhasil dibuat!`,
      createdInvites,
    };
  } catch (err: any) {
    console.error("createInvitationsAction error:", err);
    return { ok: false, error: err?.message || "Gagal membuat undangan. Silakan coba lagi." };
  }
}

/** Regenerate a single invitation's link (old link stops working). */
export async function regenerateLinkAction(
  arg1: ActionState | FormData,
  arg2?: FormData
): Promise<ActionState> {
  try {
    await requireAdmin();
    const form = arg1 instanceof FormData ? arg1 : arg2!;
    const id = z.string().uuid().safeParse(form.get("id"));
    if (!id.success || !siteUrl()) {
      return { ok: false, error: "Data undangan tidak valid atau URL situs belum dikonfigurasi." };
    }

    // Check if token column exists
    let hasTokenCol = false;
    try {
      const colRows = await query<{ column_name: string }>(
        "SELECT column_name FROM information_schema.columns WHERE table_name = 'invitations' AND column_name = 'token'"
      );
      hasTokenCol = colRows && colRows.length > 0;
      if (!hasTokenCol) {
        await query("ALTER TABLE invitations ADD COLUMN IF NOT EXISTS token TEXT");
        hasTokenCol = true;
      }
    } catch {
      hasTokenCol = false;
    }

    const token = generateToken();
    const tHash = hashToken(token);

    if (hasTokenCol) {
      await query(
        "UPDATE invitations SET token_hash = $1, token = $2, updated_at = now() WHERE id = $3",
        [tHash, token, id.data]
      );
    } else {
      await query(
        "UPDATE invitations SET token_hash = $1, updated_at = now() WHERE id = $2",
        [tHash, id.data]
      );
    }
    await query("DELETE FROM sessions WHERE invitation_id = $1", [id.data]);

    revalidatePath("/admin");
    return { ok: true, message: `${siteUrl()}/invite/${token}` };
  } catch (err: any) {
    console.error("regenerateLinkAction error:", err);
    return { ok: false, error: err?.message || "Gagal membuat link baru." };
  }
}

export async function setRevokedAction(form: FormData): Promise<ActionState> {
  try {
    await requireAdmin();
    const id = z.string().uuid().parse(form.get("id"));
    const revoke = form.get("revoke") === "1";

    await query(
      "UPDATE invitations SET is_revoked = $1, updated_at = now() WHERE id = $2",
      [revoke, id]
    );
    if (revoke) {
      await query("DELETE FROM sessions WHERE invitation_id = $1", [id]);
    }
    revalidatePath("/admin");
    return {
      ok: true,
      message: revoke ? "Undangan berhasil dicabut!" : "Undangan diaktifkan kembali!",
    };
  } catch (err: any) {
    console.error("setRevokedAction error:", err);
    return { ok: false, error: err?.message || "Gagal mengubah status undangan." };
  }
}

export async function deleteInvitationAction(form: FormData): Promise<ActionState> {
  try {
    await requireAdmin();
    const id = z.string().uuid().parse(form.get("id"));
    await query("DELETE FROM invitations WHERE id = $1", [id]);
    revalidatePath("/admin");
    return { ok: true, message: "Undangan berhasil dihapus!" };
  } catch (err: any) {
    console.error("deleteInvitationAction error:", err);
    return { ok: false, error: err?.message || "Gagal menghapus undangan." };
  }
}

/* ---------------- Bank accounts ---------------- */

export async function updateBankAction(form: FormData): Promise<ActionState> {
  try {
    await requireAdmin();
    const data = z
      .object({
        id: z.string().uuid(),
        bank_name: z.string().trim().min(1, "Nama bank wajib diisi").max(100),
        account_holder: z.string().trim().min(1, "Nama pemilik wajib diisi").max(200),
        account_number: z.string().trim().min(1, "Nomor rekening wajib diisi").max(64),
      })
      .parse({
        id: form.get("id"),
        bank_name: form.get("bank_name"),
        account_holder: form.get("account_holder"),
        account_number: form.get("account_number"),
      });

    const isEnabled = form.get("is_enabled") === "on";

    await query(
      "UPDATE bank_accounts SET bank_name = $1, account_holder = $2, account_number = $3, is_enabled = $4 WHERE id = $5",
      [data.bank_name, data.account_holder, data.account_number, isEnabled, data.id]
    );

    revalidateTag(CACHE_TAG_BANKS, { expire: 0 });
    revalidatePath("/admin");
    revalidatePath("/");
    return { ok: true, message: `Rekening ${data.bank_name} berhasil disimpan!` };
  } catch (err: any) {
    console.error("updateBankAction error:", err);
    const msg = err?.errors?.[0]?.message || err?.message || "Gagal menyimpan rekening bank.";
    return { ok: false, error: msg };
  }
}

export async function updateInvitationBanksAction(formData: FormData): Promise<ActionState> {
  try {
    await requireAdmin();
    const invitation_id = formData.get("invitation_id")?.toString();
    if (!invitation_id) {
      return { ok: false, error: "ID undangan tidak ditemukan." };
    }
    const bank_ids = formData.getAll("bank_ids") as string[];

    await query(
      "UPDATE invitations SET visible_bank_ids = $1, updated_at = now() WHERE id = $2",
      [bank_ids, invitation_id]
    );

    revalidatePath("/admin");
    revalidatePath("/");
    return { ok: true, message: "Pengaturan amplop berhasil disimpan!" };
  } catch (err: any) {
    console.error("updateInvitationBanksAction error:", err);
    return { ok: false, error: err?.message || "Gagal menyimpan pengaturan amplop." };
  }
}

/* ---------------- Settings ---------------- */

export async function updateSettingsAction(form: FormData): Promise<ActionState> {
  try {
    await requireAdmin();

    const settingKeys = [
      "opening_greeting",
      "closing_greeting",
      "love_story",
      "digital_gift_text",
      "maps_url",
      "event_date",
      "event_expiry_days",
    ] as const;

    for (const key of settingKeys) {
      let value = String(form.get(key) ?? "").slice(0, 5000);
      if (key === "maps_url" && value && !/^https:\/\//.test(value)) {
        value = "";
      }

      await query(
        `INSERT INTO site_settings (key, value, updated_at)
         VALUES ($1, $2, now())
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
        [key, value]
      );
    }

    revalidateTag(CACHE_TAG_SETTINGS, { expire: 0 });
    revalidatePath("/admin");
    revalidatePath("/");
    return { ok: true, message: "Pengaturan teks acara berhasil disimpan!" };
  } catch (err: any) {
    console.error("updateSettingsAction error:", err);
    return { ok: false, error: err?.message || "Gagal menyimpan pengaturan teks acara." };
  }
}

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const AUDIO_TYPES = ["audio/mpeg", "audio/mp4", "audio/aac", "audio/ogg", "audio/x-m4a"];
const MAX_IMAGE_BYTES = 255 * 1024; // 255 KB
const MAX_AUDIO_BYTES = 1200 * 1024; // 1.2 MB

async function upload(file: File, prefix: string, allowed: string[]) {
  if (!file || file.size === 0) throw new Error("File kosong.");
  if (!allowed.includes(file.type)) throw new Error("Tipe file tidak didukung.");
  const isAudio = AUDIO_TYPES.includes(file.type);
  const maxBytes = isAudio ? MAX_AUDIO_BYTES : MAX_IMAGE_BYTES;
  const maxLabel = isAudio ? "1.2 MB" : "255 KB";
  if (file.size > maxBytes) throw new Error(`Ukuran file maksimal ${maxLabel}.`);
  const ext = (file.name.split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g, "");
  const path = `${prefix}/${crypto.randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await saveMediaFile(path, file.type, buffer);
  return path;
}

export async function uploadAssetAction(
  arg1: ActionState | FormData,
  arg2?: FormData
): Promise<ActionState> {
  try {
    await requireAdmin();
    const form = arg1 instanceof FormData ? arg1 : arg2!;
    const kind = form.get("kind")?.toString();

    const keyMap: Record<string, string> = {
      music: "music_path",
      map: "map_image_path",
      groom_photo: "groom_photo_path",
      bride_photo: "bride_photo_path",
    };

    const key = kind ? keyMap[kind] : null;
    if (!key) return { ok: false, error: "Jenis aset tidak valid." };

    const isAudio = kind === "music";
    const path = await upload(form.get("file") as File, "assets", isAudio ? AUDIO_TYPES : IMAGE_TYPES);

    await query(
      `INSERT INTO site_settings (key, value, updated_at)
       VALUES ($1, $2, now())
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
      [key, path]
    );

    revalidateTag(CACHE_TAG_SETTINGS, { expire: 0 });
    revalidatePath("/admin");
    revalidatePath("/");
    return { ok: true, message: "Aset berhasil diunggah!" };
  } catch (e: any) {
    console.error("uploadAssetAction error:", e);
    return { ok: false, error: e?.message || "Gagal mengunggah file aset." };
  }
}

export async function deleteAssetAction(form: FormData): Promise<ActionState> {
  try {
    await requireAdmin();
    const kind = form.get("kind")?.toString();

    const keyMap: Record<string, string> = {
      music: "music_path",
      map: "map_image_path",
      groom_photo: "groom_photo_path",
      bride_photo: "bride_photo_path",
    };

    const key = kind ? keyMap[kind] : null;
    if (!key) return { ok: false, error: "Jenis aset tidak valid." };

    await query(
      `INSERT INTO site_settings (key, value, updated_at)
       VALUES ($1, '', now())
       ON CONFLICT (key) DO UPDATE SET value = '', updated_at = now()`,
      [key]
    );

    revalidateTag(CACHE_TAG_SETTINGS, { expire: 0 });
    revalidatePath("/admin");
    revalidatePath("/");
    return { ok: true, message: "Aset berhasil dihapus!" };
  } catch (err: any) {
    console.error("deleteAssetAction error:", err);
    return { ok: false, error: err?.message || "Gagal menghapus aset." };
  }
}

/* ---------------- Gallery ---------------- */

export async function uploadGalleryAction(
  arg1: ActionState | FormData,
  arg2?: FormData
): Promise<ActionState> {
  try {
    await requireAdmin();
    const form = arg1 instanceof FormData ? arg1 : arg2!;
    const files = form.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
    if (!files.length) return { ok: false, error: "Pilih minimal satu foto." };

    const last = await query<{ display_order: number }>(
      "SELECT display_order FROM gallery_images ORDER BY display_order DESC LIMIT 1"
    );
    let order = (last?.[0]?.display_order ?? 0) + 1;
    let done = 0;

    for (const f of files) {
      try {
        const path = await upload(f, "photos", IMAGE_TYPES);
        await query(
          "INSERT INTO gallery_images (storage_path, display_order, alt_text) VALUES ($1, $2, 'Foto galeri')",
          [path, order++]
        );
        done++;
      } catch (e) {
        return { ok: false, error: `${done} foto terunggah, lalu gagal: ${(e as Error).message}` };
      }
    }

    revalidateTag(CACHE_TAG_GALLERY, { expire: 0 });
    revalidatePath("/admin");
    revalidatePath("/");
    return { ok: true, message: `${done} foto berhasil diunggah.` };
  } catch (err: any) {
    console.error("uploadGalleryAction error:", err);
    return { ok: false, error: err?.message || "Gagal mengunggah foto galeri." };
  }
}

export async function toggleGalleryAction(form: FormData): Promise<ActionState> {
  try {
    await requireAdmin();
    const id = z.string().uuid().parse(form.get("id"));
    const isVisible = form.get("visible") === "1";

    await query("UPDATE gallery_images SET is_visible = $1 WHERE id = $2", [isVisible, id]);
    revalidateTag(CACHE_TAG_GALLERY, { expire: 0 });
    revalidatePath("/admin");
    revalidatePath("/");
    return {
      ok: true,
      message: isVisible ? "Foto galeri ditampilkan!" : "Foto galeri disembunyikan!",
    };
  } catch (err: any) {
    console.error("toggleGalleryAction error:", err);
    return { ok: false, error: err?.message || "Gagal mengubah status foto." };
  }
}

export async function deleteGalleryAction(form: FormData): Promise<ActionState> {
  try {
    await requireAdmin();
    const id = z.string().uuid().parse(form.get("id"));

    const rows = await query<{ storage_path: string }>(
      "SELECT storage_path FROM gallery_images WHERE id = $1 LIMIT 1",
      [id]
    );
    if (rows.length && rows[0].storage_path) {
      await deleteMediaFile(rows[0].storage_path);
    }

    await query("DELETE FROM gallery_images WHERE id = $1", [id]);
    revalidateTag(CACHE_TAG_GALLERY, { expire: 0 });
    revalidatePath("/admin");
    revalidatePath("/");
    return { ok: true, message: "Foto berhasil dihapus!" };
  } catch (err: any) {
    console.error("deleteGalleryAction error:", err);
    return { ok: false, error: err?.message || "Gagal menghapus foto." };
  }
}