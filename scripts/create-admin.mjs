import crypto from "node:crypto";
import { neon } from "@neondatabase/serverless";

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("Missing DATABASE_URL");
  process.exit(1);
}

const email = process.argv[2] || process.env.ADMIN_EMAILS?.split(",")[0]?.trim() || "rifqiinaufall70@gmail.com";
const password = process.argv[3] || process.env.ADMIN_PASSWORD || "adminwedding2026";

const salt = crypto.randomBytes(16).toString("hex");
const derived = crypto.scryptSync(password, salt, 64).toString("hex");
const passwordHash = `${salt}:${derived}`;

const sql = neon(dbUrl);

console.log(`Setting up admin account for: ${email}...`);
try {
  await sql.query(
    `INSERT INTO admin_users (email, password_hash)
     VALUES ($1, $2)
     ON CONFLICT (email)
     DO UPDATE SET password_hash = EXCLUDED.password_hash`,
    [email.toLowerCase(), passwordHash]
  );
  console.log(`Admin account for "${email}" successfully saved in Neon database!`);
  console.log(`Password: ${password}`);
} catch (err) {
  console.error("Failed to insert admin user:", err.message);
  process.exit(1);
}
