import "server-only";
import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

/**
 * Return a Neon SQL client using the DATABASE_URL environment variable.
 */
export function getDb(): NeonQueryFunction<false, false> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("Missing DATABASE_URL environment variable");
  }
  return neon(connectionString);
}

/**
 * Tagged template literal and query helper for Neon Postgres.
 */
export async function query<T = any>(queryText: string, params: any[] = []): Promise<T[]> {
  const db = getDb();
  return (await db.query(queryText, params)) as T[];
}
