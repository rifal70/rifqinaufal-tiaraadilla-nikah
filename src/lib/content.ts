/**
 * Verbatim content from the owner's invitation (Section 0).
 * DO NOT paraphrase or "correct". Items marked PLACEHOLDER must be supplied by the owner.
 */
export const WEDDING = {
  bride: {
    name: "Maghfira Tiara Adilla, S.Gz.",
    shortName: "Dilla",
    childOrder: "Putri pertama dari",
    father: "Bapak Drs. H. Supriadi (Alm.)",
    mother: "Ibu Hj. Pambudi Ningsih",
  },
  groom: {
    name: "Rifqi Naufal Gahara, S.T.",
    shortName: "Naufal",
    childOrder: "Putra pertama dari",
    father: "Bapak Drs. H. Wawan Gunawan",
    mother: "Ibu Hj. Indah Setyowati",
  },
  date: "Selasa, 29 Desember 2026",
  dateISO: "2026-12-29T08:00:00+07:00",
  akad: { title: "Akad Nikah", time: "08.00 WIB s.d. selesai" },
  resepsi: { title: "Resepsi", time: "10.00 s.d. 21.00 WIB" },
  venue: {
    name: "Kediaman Mempelai Wanita",
    address:
      "Unit 1 Jl. Simamora RT 6 RW 3 (Tugu Garuda), Desa Penawar Jaya, Kec. Banjar Margo, Kab. Tulang Bawang",
  },
  // Opening/closing greetings, Google Maps link, Denah Lokasi image and music are
  // owner-supplied and managed in the admin panel (site_settings). Never invented here.
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
