import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const SRC = path.resolve(__dirname, "../src");
const walk = (d: string): string[] =>
  readdirSync(d).flatMap((f) => {
    const p = path.join(d, f);
    return statSync(p).isDirectory() ? walk(p) : /\.(tsx?|mjs)$/.test(p) ? [p] : [];
  });

const files = walk(SRC).map((p) => ({ p, src: readFileSync(p, "utf8") }));
const clientFiles = files.filter((f) => /^\s*["']use client["']/.test(f.src));

describe("security: client bundle hygiene", () => {
  it("has client components to check", () => expect(clientFiles.length).toBeGreaterThan(0));

  it("no client component imports server-only modules or database connection secrets", () => {
    for (const f of clientFiles) {
      expect(f.src, f.p).not.toMatch(/DATABASE_URL/);
      expect(f.src, f.p).not.toMatch(/@\/lib\/neon\/db/);
      expect(f.src, f.p).not.toMatch(/@\/lib\/auth\/session/);
      expect(f.src, f.p).not.toMatch(/from ["']@\/lib\/data["']/); // type-only imports allowed
    }
  });

  it("DATABASE_URL is only referenced in server-side neon db client", () => {
    const refs = files.filter((f) => f.src.includes("DATABASE_URL")).map((f) => path.relative(SRC, f.p));
    expect(refs).toEqual([path.join("lib", "neon", "db.ts")]);
  });

  it("raw tokens are never logged", () => {
    for (const f of files) expect(f.src, f.p).not.toMatch(/console\.\w+\([^)]*token/i);
  });
});
