"use server";

import crypto from "crypto";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAuthClient, isAdminEmail, requireAdmin } from "@/lib/auth/admin";
import { createServiceClient } from "@/lib/supabase/server";
import { generateToken, hashToken } from "@/lib/auth/session";
import { isAllowed, clientIp } from "@/lib/rate-limit";
import { STORAGE_BUCKET, SETTING_KEYS } from "@/lib/data";

export type ActionState = { ok?: boolean; error?: string; message?: string; csv?: string };

const siteUrl = () => (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");

/* ---------------- Auth ---------------- */

export async function loginAction(_: ActionState, form: FormData): Promise<ActionState> {
  const h = await headers();
  if (!(await isAllowed("admin-login", clientIp(h), 5, 300))) {
    return { error: "Terlalu banyak percobaan. Coba lagi nanti." };
  }
  const parsed = z
    .object({ email: z.string().email(), password: z.string().min(1) })
    .safeParse({ email: form.get("email"), password: form.get("password") });
  if (!parsed.success) return { error: "Email atau kata sandi salah." };

  const supabase = await createAuthClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error || !isAdminEmail(data.user?.email)) {
    await supabase.auth.signOut();
    return { error: "Email atau kata sandi salah." };
  }
  redirect("/admin");
}

export async function logoutAction() {
  const supabase = await createAuthClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

/* ---------------- Invitations ---------------- */

/** Bulk create: one guest name per line, optional ";count". Raw links returned ONCE as CSV. */
export async function createInvitationsAction(formData: FormData) {
  await requireAdmin();

  const rawGuests = formData.get("guests")?.toString() ?? "";
  const lines = rawGuests
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  if (!lines.length) return;

  const supabase = createServiceClient();

  // 1. Ambil data master rekening aktif untuk pemetaan urutan -> ID
  const { data: allBanks } = await supabase
    .from("bank_accounts")
    .select("id, display_order, account_number")
    .eq("is_enabled", true);

  const activeBankList = allBanks ?? [];

  // 2. Parse tiap baris: nama;jumlah;norek_atau_urutan
  const records = lines.map((line) => {
    const parts = line.split(";").map((s) => s.trim());
    const name = parts[0] || "Tamu";
    const count = Math.max(1, parseInt(parts[1] || "1", 10) || 1);
    const bankRef = parts[2]?.toLowerCase(); // bisa: "1", "1,2", "all", "none", atau nomor rekening asli

    let matchedBankIds: string[] | null = null;

    if (!bankRef || bankRef === "all") {
      // Default / "all": tampilkan semua rekening yang aktif
      matchedBankIds = activeBankList.map((b) => b.id);
    } else if (bankRef === "none" || bankRef === "0" || bankRef === "-") {
      // "none": sembunyikan amplop sepenuhnya
      matchedBankIds = [];
    } else {
      // Cari kecocokan berdasarkan nomor urut (display_order) atau string nomor rekening asli
      const targets = bankRef.split(",").map((t) => t.trim());
      matchedBankIds = activeBankList
        .filter((b) =>
          targets.includes(String(b.display_order)) ||
          targets.includes(b.account_number)
        )
        .map((b) => b.id);
    }

    return {
      guest_name: name,
      guest_count: count,
      visible_bank_ids: matchedBankIds,
    };
  });

  const { error } = await supabase.from("invitations").insert(records);

  if (error) {
    throw new Error(`Gagal membuat undangan: ${error.message}`);
  }

  revalidatePath("/admin");
}

/** Regenerate a single invitation's link (old link stops working). */
export async function regenerateLinkAction(_: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = z.string().uuid().safeParse(form.get("id"));
  if (!id.success || !siteUrl()) return { error: "Data tidak valid." };
  const token = generateToken();
  const supabase = createServiceClient();
  const { error } = await supabase.from("invitations").update({ token_hash: hashToken(token), updated_at: new Date().toISOString() }).eq("id", id.data);
  if (error) return { error: "Gagal membuat link baru." };
  await supabase.from("sessions").delete().eq("invitation_id", id.data);
  return { ok: true, message: `${siteUrl()}/invite/${token}` };
}

export async function setRevokedAction(form: FormData) {
  await requireAdmin();
  const id = z.string().uuid().parse(form.get("id"));
  const revoke = form.get("revoke") === "1";
  const supabase = createServiceClient();
  await supabase.from("invitations").update({ is_revoked: revoke, updated_at: new Date().toISOString() }).eq("id", id);
  if (revoke) await supabase.from("sessions").delete().eq("invitation_id", id);
  revalidatePath("/admin");
}

export async function deleteInvitationAction(form: FormData) {
  await requireAdmin();
  const id = z.string().uuid().parse(form.get("id"));
  await createServiceClient().from("invitations").delete().eq("id", id);
  revalidatePath("/admin");
}

/* ---------------- Bank accounts ---------------- */

export async function updateBankAction(form: FormData) {
  await requireAdmin();
  const data = z
    .object({
      id: z.string().uuid(),
      bank_name: z.string().trim().min(1).max(100),
      account_holder: z.string().trim().min(1).max(200),
      account_number: z.string().trim().min(1).max(64), // kept as exact string
    })
    .parse({
      id: form.get("id"),
      bank_name: form.get("bank_name"),
      account_holder: form.get("account_holder"),
      account_number: form.get("account_number"),
    });
  await createServiceClient()
    .from("bank_accounts")
    .update({ ...data, is_enabled: form.get("is_enabled") === "on" })
    .eq("id", data.id);
  revalidatePath("/admin");
  revalidatePath("/");
}

/* ---------------- Settings ---------------- */

export async function updateSettingsAction(form: FormData) {
  await requireAdmin();
  const now = new Date().toISOString();
  const rows = (["opening_greeting", "closing_greeting", "maps_url"] as const).map((key) => ({
    key,
    value: String(form.get(key) ?? "").slice(0, 5000),
    updated_at: now,
  }));
  const maps = rows.find((r) => r.key === "maps_url")!;
  if (maps.value && !/^https:\/\//.test(maps.value)) maps.value = "";
  await createServiceClient().from("site_settings").upsert(rows);
  revalidatePath("/admin");
  revalidatePath("/");
}

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const AUDIO_TYPES = ["audio/mpeg", "audio/mp4", "audio/aac", "audio/ogg", "audio/x-m4a"];
const MAX_BYTES = 5 * 1024 * 1024;

async function upload(file: File, prefix: string, allowed: string[]) {
  if (!file || file.size === 0) throw new Error("File kosong.");
  if (!allowed.includes(file.type)) throw new Error("Tipe file tidak didukung.");
  if (file.size > MAX_BYTES) throw new Error("Ukuran file maksimal 5 MB.");
  const ext = (file.name.split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g, "");
  const path = `${prefix}/${crypto.randomUUID()}.${ext}`;
  const { error } = await createServiceClient()
    .storage.from(STORAGE_BUCKET)
    .upload(path, Buffer.from(await file.arrayBuffer()), { contentType: file.type, upsert: false });
  if (error) throw new Error("Gagal mengunggah.");
  return path;
}

export async function uploadAssetAction(_: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  const kind = form.get("kind");
  const key = kind === "music" ? "music_path" : kind === "map" ? "map_image_path" : null;
  if (!key || !SETTING_KEYS.includes(key)) return { error: "Jenis tidak valid." };
  try {
    const path = await upload(form.get("file") as File, "assets", kind === "music" ? AUDIO_TYPES : IMAGE_TYPES);
    await createServiceClient().from("site_settings").upsert({ key, value: path, updated_at: new Date().toISOString() });
    revalidatePath("/admin");
    return { ok: true, message: "Berhasil diunggah." };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

/* ---------------- Gallery ---------------- */

export async function uploadGalleryAction(_: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  const files = form.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (!files.length) return { error: "Pilih minimal satu foto." };
  const supabase = createServiceClient();
  const { data: last } = await supabase.from("gallery_images").select("display_order").order("display_order", { ascending: false }).limit(1);
  let order = (last?.[0]?.display_order ?? 0) + 1;
  let done = 0;
  for (const f of files) {
    try {
      const path = await upload(f, "photos", IMAGE_TYPES);
      await supabase.from("gallery_images").insert({ storage_path: path, display_order: order++, alt_text: "Foto galeri" });
      done++;
    } catch (e) {
      return { error: `${done} foto terunggah, lalu gagal: ${(e as Error).message}` };
    }
  }
  revalidatePath("/admin");
  return { ok: true, message: `${done} foto terunggah.` };
}

export async function toggleGalleryAction(form: FormData) {
  await requireAdmin();
  const id = z.string().uuid().parse(form.get("id"));
  await createServiceClient().from("gallery_images").update({ is_visible: form.get("visible") === "1" }).eq("id", id);
  revalidatePath("/admin");
}

export async function deleteGalleryAction(form: FormData) {
  await requireAdmin();
  const id = z.string().uuid().parse(form.get("id"));
  const supabase = createServiceClient();
  const { data } = await supabase.from("gallery_images").select("storage_path").eq("id", id).single();
  if (data) await supabase.storage.from(STORAGE_BUCKET).remove([data.storage_path]);
  await supabase.from("gallery_images").delete().eq("id", id);
  revalidatePath("/admin");
}

export async function updateInvitationBanksAction(formData: FormData) {
  await requireAdmin();
  const invitation_id = formData.get("invitation_id")?.toString();
  const bank_ids = formData.getAll("bank_ids") as string[];

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("invitations")
    .update({ visible_bank_ids: bank_ids })
    .eq("id", invitation_id);

  if (error) throw new Error(error.message);

  revalidatePath("/admin");
  revalidatePath("/");
}