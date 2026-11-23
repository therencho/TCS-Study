import "server-only";
import { neon } from "@neondatabase/serverless";

/** Neon is optional: without DATABASE_URL the app runs local-only. */
export const dbEnabled = () => Boolean(process.env.DATABASE_URL);

let client: ReturnType<typeof neon> | null = null;
export function db() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
  client ??= neon(process.env.DATABASE_URL);
  return client;
}
