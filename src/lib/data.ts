import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import { FALLBACK_BANKS, type BankAccount } from "@/lib/content";

export const STORAGE_BUCKET = "gallery";
const SIGNED_URL_TTL = 60 * 60 * 6; // 6 hours

export interface SiteSettings {
  opening_greeting: string;
  closing_greeting: string;
  music_path: string;
  maps_url: string;
  map_image_path: string;
  groom_photo_path?: string;
  bride_photo_path?: string;
  event_date?: string;
  event_expiry_days?: string;
  love_story?: string;
  digital_gift_text?: string;
}

export const SETTING_KEYS = [
  "opening_greeting",
  "closing_greeting",
  "maps_url",
  "map_image_path",
  "music_path",
  "groom_photo_path",
  "bride_photo_path",
  "event_date",
  "event_expiry_days",
  "love_story",
  "digital_gift_text",
] as const;

export type SettingKey = (typeof SETTING_KEYS)[number];

const isPlaceholder = (v?: string | null) => !v || v.trim() === "" || v.startsWith("[PLACEHOLDER");

export async function getSettings(): Promise<SiteSettings> {
  const empty: SiteSettings = {
    opening_greeting: "",
    closing_greeting: "",
    music_path: "",
    maps_url: "",
    map_image_path: "",
    groom_photo_path: "",
    bride_photo_path: "",
    event_date: "",
    event_expiry_days: "",
    love_story: "",
    digital_gift_text: "",
  };

  try {
    const { data } = await createServiceClient().from("site_settings").select("key, value");
    for (const row of data ?? []) {
      if ((SETTING_KEYS as readonly string[]).includes(row.key) && !isPlaceholder(row.value)) {
        empty[row.key as keyof SiteSettings] = row.value;
      }
    }
  } catch {
    /* use empty → placeholders shown */
  }
  return empty;
}

/** Format objek Date ke teks representasi Indonesia (contoh: "Selasa, 29 Desember 2026") */
export function formatWeddingDate(date: Date): string {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(date);
}

/** Mengambil tanggal acara display & ISO dinamis dari site_settings dengan fallback default */
export async function getDynamicWeddingDate(fallbackIso = "2026-12-29T08:00:00+07:00") {
  const settings = await getSettings();
  const rawDate = settings.event_date;

  if (rawDate) {
    const parsed = new Date(rawDate);
    if (!isNaN(parsed.getTime())) {
      return {
        dateText: formatWeddingDate(parsed),
        dateISO: parsed.toISOString(),
      };
    }
  }

  const fallbackDate = new Date(fallbackIso);
  return {
    dateText: formatWeddingDate(fallbackDate),
    dateISO: fallbackIso,
  };
}

export async function getBanks(includeDisabled = true): Promise<BankAccount[]> {
  try {
    let q = createServiceClient()
      .from("bank_accounts")
      .select("id, bank_name, account_holder, account_number, is_enabled")
      .order("display_order", { ascending: true });
    if (!includeDisabled) q = q.eq("is_enabled", true);
    const { data, error } = await q;
    if (error || !data?.length) return FALLBACK_BANKS;
    return data.map((b) => ({ ...b, account_number: String(b.account_number) }));
  } catch {
    return FALLBACK_BANKS;
  }
}

/** Turn a storage path into a short-lived signed URL; external http(s) URLs pass through. */
export async function signedUrl(path?: string | null): Promise<string> {
  if (!path) return "";
  if (/^https?:\/\//.test(path) || path.startsWith("/")) return path;
  const { data } = await createServiceClient().storage.from(STORAGE_BUCKET).createSignedUrl(path, SIGNED_URL_TTL);
  return data?.signedUrl ?? "";
}

export interface GalleryItem {
  id: string;
  url: string;
  alt: string;
}

export async function getGallery(): Promise<GalleryItem[]> {
  try {
    const supabase = createServiceClient();
    const { data } = await supabase
      .from("gallery_images")
      .select("id, storage_path, alt_text")
      .eq("is_visible", true)
      .order("display_order", { ascending: true })
      .limit(60);
    if (!data?.length) return [];
    const { data: signed } = await supabase.storage
      .from(STORAGE_BUCKET)
      .createSignedUrls(data.map((d) => d.storage_path), SIGNED_URL_TTL);
    return data
      .map((d, i) => ({ id: d.id, url: signed?.[i]?.signedUrl ?? "", alt: d.alt_text || "Foto galeri" }))
      .filter((g) => g.url);
  } catch {
    return [];
  }
}