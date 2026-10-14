/**
 * Applies the migrations in supabase/migrations/ in order, directly against
 * the database (requires SUPABASE_DB_PASSWORD in .env.local).
 *
 * Usage: npx tsx scripts/apply-migrations.ts
 */
import { Client } from "pg";
import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { loadEnv } from "./lib/env";

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ref = url.match(/https:\/\/([a-z0-9]+)\.supabase\.co/)?.[1];
const password = process.env.SUPABASE_DB_PASSWORD;

if (!ref || !password) {
  console.error("❌ NEXT_PUBLIC_SUPABASE_URL or SUPABASE_DB_PASSWORD is missing from .env.local");
  process.exit(1);
}

// Try the direct connection (IPv6-only) first, then the regional poolers
const REGIONS = [
  "aws-1-eu-north-1",
  "aws-0-eu-north-1",
  "aws-1-eu-west-1",
  "aws-0-eu-west-1",
  "aws-1-eu-west-2",
  "aws-0-eu-west-2",
  "aws-1-eu-central-1",
  "aws-0-eu-central-1",
];
const candidates = [
  { host: `db.${ref}.supabase.co`, port: 5432, user: "postgres" },
  ...REGIONS.map((r) => ({
    host: `${r}.pooler.supabase.com`,
    port: 5432,
    user: `postgres.${ref}`,
  })),
];

async function connect(): Promise<Client> {
  for (const c of candidates) {
    const client = new Client({
      host: c.host,
      port: c.port,
      user: c.user,
      password,
      database: "postgres",
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 8000,
    });
    try {
      await client.connect();
      console.log(`🔌 Connected via ${c.host}`);
      return client;
    } catch (err) {
      console.log(`   ✗ ${c.host}: ${(err as Error).message.slice(0, 80)}`);
      await client.end().catch(() => {});
    }
  }
  throw new Error("Could not connect to the database through any host.");
}

async function main() {
  const client = await connect();
  const dir = resolve(import.meta.dirname, "..", "supabase", "migrations");
  const files = readdirSync(dir)
    .filter((f) => /^\d{4}_.*\.sql$/.test(f))
    .sort();

  for (const file of files) {
    const sql = readFileSync(join(dir, file), "utf8");
    try {
      await client.query(sql);
      console.log(`✅ ${file}`);
    } catch (err) {
      const msg = (err as Error).message;
      if (/already exists/i.test(msg)) {
        console.log(`⏭️  ${file} (already applied: ${msg.slice(0, 60)})`);
      } else {
        console.error(`❌ ${file}: ${msg}`);
        await client.end();
        process.exit(1);
      }
    }
  }

  const { rows } = await client.query(
    `select table_name from information_schema.tables where table_schema='public' order by 1`
  );
  console.log(`\n📋 Tables created: ${rows.map((r) => r.table_name).join(", ")}`);
  await client.end();
}

main();
