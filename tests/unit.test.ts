import { describe, it, expect, vi } from "vitest";

vi.mock("next/headers", () => ({ cookies: vi.fn(), headers: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createServiceClient: vi.fn() }));

import { hashToken, generateToken } from "@/lib/auth/session";
import { FALLBACK_BANKS, WEDDING } from "@/lib/content";

describe("tokens", () => {
  it("generates 256-bit base64url tokens that are unique", () => {
    const set = new Set(Array.from({ length: 2000 }, generateToken));
    expect(set.size).toBe(2000);
    for (const t of set) expect(t).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  it("hashes deterministically with SHA-256 and never returns the raw token", () => {
    const t = generateToken();
    expect(hashToken(t)).toBe(hashToken(t));
    expect(hashToken(t)).toMatch(/^[a-f0-9]{64}$/);
    expect(hashToken(t)).not.toContain(t);
    expect(hashToken(t + "x")).not.toBe(hashToken(t));
  });
});

describe("bank accounts (exact strings)", () => {
  it("keeps account numbers exactly as provided, including leading zeros", () => {
    expect(FALLBACK_BANKS.map((b) => [b.bank_name, b.account_holder, b.account_number])).toEqual([
      ["Bank DKI", "Wawan Gunawan", "001-312-8523"],
      ["Mandiri", "Maghfira Tiara Adilla", "113-000-6987-589"],
      ["BRI", "Pambudi Ningsih", "5642-01-027719-53-0"],
    ]);
    for (const b of FALLBACK_BANKS) expect(typeof b.account_number).toBe("string");
  });
});

describe("verbatim event content", () => {
  it("matches the owner's invitation", () => {
    expect(WEDDING.bride.name).toBe("Maghfira Tiara Adilla, S.Gz");
    expect(WEDDING.groom.name).toBe("Rifqi Naufal Gahara, S.T");
    expect(WEDDING.bride.father).toBe("Bapak Drs. H. Supriadi (Alm.)");
    expect(WEDDING.bride.mother).toBe("Ibu Hj. Pambudi Ningsih");
    expect(WEDDING.groom.father).toBe("Bapak H. Wawan Gunawan");
    expect(WEDDING.groom.mother).toBe("Ibu Hj. Indah Setyowati");
    expect(WEDDING.date).toBe("Selasa, 29 Desember 2026");
    expect(WEDDING.venue.address).toBe(
      "Unit 1 Jl. Simamora RT 6 RW 3 (Tugu Garuda), Desa Penawar Jaya, Kec. Banjar Margo, Kab. Tulang Bawang"
    );
  });
});
