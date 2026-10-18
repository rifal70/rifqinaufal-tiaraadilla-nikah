// Read-only check of which tables / functions exist in the Supabase project.
import { createClient } from "@supabase/supabase-js";
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
for (const t of ["invitations", "sessions", "bank_accounts", "gallery_images", "site_settings", "rate_limits"]) {
  const { data, error } = await s.from(t).select("*").limit(1);
  console.log(t.padEnd(16), error ? `MISSING/ERR: ${error.message}` : `OK (${data.length ? "has rows" : "empty"})`);
}
const { data: rl, error: rlErr } = await s.rpc("check_rate_limit", { p_bucket: "selftest", p_max: 100, p_window_seconds: 1 });
console.log("check_rate_limit", rlErr ? `ERR: ${rlErr.message}` : `OK (${rl})`);
const { data: b, error: bErr } = await s.storage.getBucket("gallery");
console.log("bucket gallery  ", bErr ? `ERR: ${bErr.message}` : `OK public=${b.public}`);
const { data: banks } = await s.from("bank_accounts").select("display_order,bank_name,account_holder,account_number,is_enabled").order("display_order");
console.log(JSON.stringify(banks));
