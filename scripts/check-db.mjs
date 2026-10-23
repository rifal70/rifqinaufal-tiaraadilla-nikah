// Read-only check of which tables / functions exist in the Neon database.
import { neon } from "@neondatabase/serverless";

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("Missing DATABASE_URL in environment.");
  process.exit(1);
}

const sql = neon(dbUrl);

console.log("Checking Neon database tables...");
for (const t of ["invitations", "sessions", "admin_users", "bank_accounts", "gallery_images", "site_settings", "rate_limits", "media_files"]) {
  try {
    const rows = await sql.query(`SELECT * FROM ${t} LIMIT 1`);
    console.log(t.padEnd(16), `OK (${rows.length ? "has rows" : "empty"})`);
  } catch (err) {
    console.log(t.padEnd(16), `MISSING/ERR: ${err.message}`);
  }
}

try {
  const rl = await sql.query("SELECT check_rate_limit($1, $2, $3) AS allowed", ["selftest", 100, 1]);
  console.log("check_rate_limit".padEnd(16), `OK (${rl[0]?.allowed})`);
} catch (err) {
  console.log("check_rate_limit".padEnd(16), `ERR: ${err.message}`);
}

try {
  const banks = await sql.query("SELECT display_order, bank_name, account_holder, account_number, is_enabled FROM bank_accounts ORDER BY display_order");
  console.log("Bank Accounts:", JSON.stringify(banks));
} catch (err) {
  console.log("Bank Accounts: ERR:", err.message);
}
