import "server-only";
import { unstable_cache } from "next/cache";
import { query } from "@/lib/neon/db";
import { FALLBACK_BANKS, type BankAccount } from "@/lib/content";
import { getMediaUrl } from "@/lib/media";

export const STORAGE_BUCKET = "gallery";

export const CACHE_TAG_SETTINGS = "site_settings";
export const CACHE_TAG_BANKS = "bank_accounts";
export const CACHE_TAG_GALLERY = "gallery_images";

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
  envelope_message?: string;
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
  "envelope_message",
] as const;

export type SettingKey = (typeof SETTING_KEYS)[number];

const isPlaceholder = (v?: string | null) => {
  if (!v) return true;
  const t = v.trim().toLowerCase();
  return (
    t === "" ||
    t === "null" ||
    t === "undefined" ||
    t === "-" ||
    t === "none" ||
    t === "empty" ||
    t.startsWith("[placeholder") ||
    t.startsWith("placeholder")
  );
};

export const getSettings = unstable_cache(
  async (): Promise<SiteSettings> => {
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
      envelope_message: "",
    };

    try {
      const rows = await query<{ key: string; value: string }>(
        "SELECT key, value FROM site_settings"
      );
      for (const row of rows) {
        if ((SETTING_KEYS as readonly string[]).includes(row.key) && !isPlaceholder(row.value)) {
          empty[row.key as keyof SiteSettings] = row.value;
        }
      }
    } catch (err) {
      console.error("Failed to fetch settings from Neon:", err);
      /* use empty → placeholders shown */
    }
    return empty;
  },
  ["site_settings_cache"],
  {
    revalidate: 3600, // 1 jam di memori server
    tags: [CACHE_TAG_SETTINGS],
  }
);

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

export const getBanks = unstable_cache(
  async (includeDisabled = true): Promise<BankAccount[]> => {
    try {
      const sqlQuery = includeDisabled
        ? "SELECT id, bank_name, account_holder, account_number, is_enabled FROM bank_accounts ORDER BY display_order ASC"
        : "SELECT id, bank_name, account_holder, account_number, is_enabled FROM bank_accounts WHERE is_enabled = true ORDER BY display_order ASC";

      const rows = await query<BankAccount>(sqlQuery);
      if (!rows?.length) return FALLBACK_BANKS;
      return rows.map((b) => ({ ...b, account_number: String(b.account_number) }));
    } catch (err) {
      console.error("Failed to fetch banks from Neon:", err);
      return FALLBACK_BANKS;
    }
  },
  ["bank_accounts_cache"],
  {
    revalidate: 3600, // 1 jam di memori server
    tags: [CACHE_TAG_BANKS],
  }
);

/**
 * Returns public URL for a given media path.
 * External URLs pass through unchanged.
 */
export async function signedUrl(path?: string | null): Promise<string> {
  return getMediaUrl(path);
}

export interface GalleryItem {
  id: string;
  url: string;
  alt: string;
}

export const getGallery = unstable_cache(
  async (): Promise<GalleryItem[]> => {
    try {
      const rows = await query<{ id: string; storage_path: string; alt_text: string | null }>(
        "SELECT id, storage_path, alt_text FROM gallery_images WHERE is_visible = true ORDER BY display_order ASC LIMIT 60"
      );

      if (!rows.length) return [];

      const items: GalleryItem[] = [];
      for (const d of rows) {
        const url = await getMediaUrl(d.storage_path);
        if (url) {
          items.push({
            id: d.id,
            url,
            alt: d.alt_text || "Foto galeri",
          });
        }
      }
      return items;
    } catch (err) {
      console.error("Failed to fetch gallery from Neon:", err);
      return [];
    }
  },
  ["gallery_images_cache"],
  {
    revalidate: 3600, // 1 jam di memori server
    tags: [CACHE_TAG_GALLERY],
  }
);