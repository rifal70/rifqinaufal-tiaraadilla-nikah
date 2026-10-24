import { describe, it, expect, vi, beforeEach } from "vitest";

const { validate, allowed, redirect } = vi.hoisted(() => ({
  validate: vi.fn(),
  allowed: vi.fn(),
  redirect: vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
}));

vi.mock("@/lib/auth/session", () => ({ validateTokenAndCreateSession: validate }));
vi.mock("@/lib/rate-limit", () => ({
  isAllowed: allowed,
  isAllowedInMemory: () => true,
  clientIp: () => "1.2.3.4",
}));
vi.mock("next/navigation", () => ({ redirect }));

import { GET } from "@/app/invite/[token]/route";

const call = (token: string) =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  GET(new Request(`http://x/invite/${token}`) as any, { params: Promise.resolve({ token }) } as any);

const GOOD = "A".repeat(43);

describe("GET /invite/[token] access control", () => {
  beforeEach(() => {
    validate.mockReset();
    allowed.mockReset().mockResolvedValue(true);
    redirect.mockClear();
  });

  it("rejects malformed tokens without touching the DB", async () => {
    const res = await call("bad token!");
    expect(res.status).toBe(404);
    expect(validate).not.toHaveBeenCalled();
  });

  it("returns generic 404 for invalid / revoked / expired tokens", async () => {
    validate.mockResolvedValue(null);
    const res = await call(GOOD);
    expect(res.status).toBe(404);
    expect(await res.text()).toBe("Not Found");
    expect(res.headers.get("Cache-Control")).toContain("no-store");
    expect(res.headers.get("Referrer-Policy")).toBe("no-referrer");
  });

  it("redirects to /?status=busy when rate limited, without validating", async () => {
    allowed.mockResolvedValue(false);
    const res = await call(GOOD);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/?status=busy");
    expect(validate).not.toHaveBeenCalled();
  });

  it("redirects to / (token removed from URL) on valid token", async () => {
    validate.mockResolvedValue({ id: "s", invitation_id: "i", guest_name: "G", expires_at: "" });
    await expect(call(GOOD)).rejects.toThrow("NEXT_REDIRECT");
    expect(redirect).toHaveBeenCalledWith("/");
  });
});
