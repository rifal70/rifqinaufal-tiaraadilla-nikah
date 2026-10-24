import { getSettings, formatWeddingDate } from "@/lib/data";
/**
 * Verbatim content from the owner's invitation (Section 0).
 * DO NOT paraphrase or "correct". Items marked PLACEHOLDER must be supplied by the owner.
 */
export const WEDDING = {
  bride: {
    name: "Maghfira Tiara Adilla, S.Gz",
    shortName: "Dilla",
    childOrder: "Putri pertama dari",
    father: "Bapak Drs. H. Supriadi (Alm.)",
    mother: "Ibu Hj. Pambudi Ningsih",
  },
  groom: {
    name: "Rifqi Naufal Gahara, S.T",
    shortName: "Naufal",
    childOrder: "Putra pertama dari",
    father: "Bapak Drs. H. Wawan Gunawan",
    mother: "Ibu Hj. Indah Setyowati",
  },
  date: "Selasa, 29 Desember 2026" as string,
  dateISO: "2026-12-29T08:00:00+07:00" as string,
  akad: { title: "Akad Nikah", time: "08.00 WIB s.d. selesai" },
  resepsi: { title: "Resepsi", time: "10.00 s.d. 21.00 WIB" },
  venue: {
    name: "Kediaman Mempelai Wanita",
    address:
      "Unit 1 Jl. Simamora RT 6 RW 3 (Tugu Garuda), Desa Penawar Jaya, Kec. Banjar Margo, Kab. Tulang Bawang",
  },
} as const;

export interface BankAccount {
  id: string;
  bank_name: string;
  account_holder: string;
  account_number: string; // always string — never parse
  is_enabled: boolean;
}

/** Fallback used if DB is unreachable. Values exactly as provided by owner. */
export const FALLBACK_BANKS: BankAccount[] = [
  { id: "1", bank_name: "Bank DKI", account_holder: "Wawan Gunawan", account_number: "001-312-8523", is_enabled: true },
  { id: "2", bank_name: "Mandiri", account_holder: "Maghfira Tiara Adilla", account_number: "113-000-6987-589", is_enabled: true },
  { id: "3", bank_name: "BRI", account_holder: "Pambudi Ningsih", account_number: "5642-01-027719-53-0", is_enabled: true },
];

export const LOVE_STORY = {
  story: `Berawal kenal dari game online di tahun 2016, saat itu kami sama-sama masih berkuliah dan hobi bermain game. Sempat lost contact beberapa tahun, sampai akhirnya di tahun 2021 Naufal mengucapkan selamat ulang tahun ke Dilla. Dari ucapan sederhana itu, komunikasi kami pun kembali terjalin.

Sejak saat itu, kami mulai sering ngobrol dan ketemu. Kebetulan, Dilla sering mengantar adik bungsunya untuk bersekolah di Bekasi dan Dilla sering mampir ke rumah Naufal. Dari yang awalnya cuma teman kenal, lama-lama jadi makin dekat, sampai akhirnya menjalin hubungan.

Kami nggak pernah menyangka, perkenalan dari game online yang sempat terputus ini justru membawa kami sampai sejauh ini. Sekarang, kami siap memulai babak baru bersama dan melanjutkan cerita ini untuk selamanya. ❤️`,
};

export const DIGITAL_GIFT_DEFAULT_TEXT = `Doa restu Anda merupakan karunia yang sangat berarti bagi kami. Dan jika memberi adalah ungkapan tanda kasih Anda, Anda dapat memberi kado secara digital dengan membuka kotak kado di bawah ini:`;

export const DEFAULT_ENVELOPE_MESSAGE = "Hi, kami tunggu kedatangan dan doa restunya ya. Jangan lupa datang dan ramaikan acara kami.";