#!/usr/bin/env node
/**
 * Bulk-generate invitation links from a guest list.
 *
 * Usage:
 *   node --env-file=.env.local scripts/generate-invites.mjs guests.txt [output.csv]
 *
 * Input: one guest per line, optional ";count" (e.g. "Keluarga Budi;4"). Lines starting with # are ignored.
 * Output: CSV (nama,jumlah,link). Raw tokens exist ONLY in this file — the DB stores SHA-256 hashes.
 * Keep the CSV private; it is gitignored.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { randomBytes, createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const [, , input, output = `output/undangan-${Date.now()}.csv`] = process.argv;
const { NEXT_PUBLIC_SUPABASE_URL: url, SUPABASE_SERVICE_ROLE_KEY: key, NEXT_PUBLIC_SITE_URL: site } = process.env;

if (!input) {
  console.error("Usage: node --env-file=.env.local scripts/generate-invites.mjs guests.txt [output.csv]");
  process.exit(1);
}
if (!url || !key || !site) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SITE_URL");
  process.exit(1);
}

const guests = readFileSync(input, "utf8")
  .split(/\r?\n/)
  .map((l) => l.trim())
  .filter((l) => l && !l.startsWith("#"))
  .map((l) => {
    const [name, count] = l.split(";");
    return { name: name.trim().slice(0, 200), count: Math.max(1, Math.min(50, parseInt(count ?? "1", 10) || 1)) };
  })
  .filter((g) => g.name);

const supabase = createClient(url, key, { auth: { persistSession: false } });
const base = site.replace(/\/$/, "");
const lines = ["nama,jumlah,link"];
const rows = guests.map((g) => {
  const token = randomBytes(32).toString("base64url");
  lines.push(`"${g.name.replace(/"/g, '""')}",${g.count},${base}/invite/${token}`);
  return { guest_name: g.name, guest_count: g.count, token_hash: createHash("sha256").update(token).digest("hex") };
});

for (let i = 0; i < rows.length; i += 500) {
  const { error } = await supabase.from("invitations").insert(rows.slice(i, i + 500));
  if (error) {
    console.error(`Insert failed at batch starting ${i}: ${error.message}. Links from row ${i + 1} onward are NOT valid.`);
    lines.splice(i + 1);
    break;
  }
}

const { mkdirSync } = await import("node:fs");
mkdirSync(output.includes("/") ? output.slice(0, output.lastIndexOf("/")) : ".", { recursive: true });
writeFileSync(output, "\ufeff" + lines.join("\n"), "utf8");
console.log(`Wrote ${lines.length - 1} links to ${output}`);
