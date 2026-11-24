const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { createRequire } = require("node:module");
const { spawnSync } = require("node:child_process");
const root = path.resolve(__dirname, "..");
const backend = path.join(root, "apps/backend");
const backendRequire = createRequire(path.join(backend, "package.json"));
const { PrismaClient } = backendRequire("@prisma/client");
const migrationDir = path.join(backend, "prisma/migrations");
const sha = (value) => crypto.createHash("sha256").update(value).digest("hex");
function migrations() {
  return Object.fromEntries(
    fs
      .readdirSync(migrationDir)
      .filter((n) => fs.existsSync(path.join(migrationDir, n, "migration.sql")))
      .sort()
      .map((n) => [
        n,
        sha(
          fs
            .readFileSync(path.join(migrationDir, n, "migration.sql"), "utf8")
            .replace(/\r\n/g, "\n"),
        ),
      ]),
  );
}
function previewUrl(value) {
  const u = new URL(value || "");
  if (
    !["postgres:", "postgresql:"].includes(u.protocol) ||
    u.hostname !== "ep-tiny-bonus-at29rygs.c-9.us-east-1.aws.neon.tech" ||
    u.pathname !== "/northeastour" ||
    (u.port && u.port !== "5432") ||
    !["require", "verify-full"].includes(u.searchParams.get("sslmode"))
  )
    throw Error(
      "Destino recusado: exige conexão direta SSL ao development-seridotour.",
    );
  return u;
}
function readEnv(file) {
  return Object.fromEntries(
    fs
      .readFileSync(file, "utf8")
      .split(/\r?\n/)
      .filter((l) => l && !l.startsWith("#"))
      .map((l) => {
        const i = l.indexOf("=");
        return [l.slice(0, i), l.slice(i + 1)];
      }),
  );
}
async function withDb(url, fn) {
  const db = new PrismaClient({ datasources: { db: { url } } });
  try {
    return await fn(db);
  } finally {
    await db.$disconnect();
  }
}
async function fingerprint(db) {
  const tables = [
    "User",
    "Token",
    "Place",
    "Review",
    "Itinerary",
    "_ItineraryToPlace",
  ];
  const result = {};
  // Hashes only: never log rows, passwords or session digests.
  for (const table of tables) {
    const rows = await db.$queryRawUnsafe(
      `SELECT row_to_json(t)::text AS row FROM "${table}" t ORDER BY row_to_json(t)::text`,
    );
    result[table] = { count: rows.length, sha256: sha(JSON.stringify(rows)) };
  }
  return result;
}
async function checkHistory(db, expectedCount) {
  const rows = await db.$queryRawUnsafe(
    'SELECT migration_name,checksum,finished_at,rolled_back_at FROM "_prisma_migrations" ORDER BY migration_name',
  );
  const expected = migrations();
  if (
    rows.length !== expectedCount ||
    rows.some(
      (r) =>
        expected[r.migration_name] !== r.checksum ||
        !r.finished_at ||
        r.rolled_back_at,
    )
  )
    throw Error("Histórico de migrações divergente.");
}
function prisma(args, url) {
  const r = spawnSync(
    process.execPath,
    [backendRequire.resolve("prisma/build/index.js"), ...args],
    {
      cwd: backend,
      env: { ...process.env, DATABASE_URL: url },
      encoding: "utf8",
      maxBuffer: 4 * 1024 * 1024,
    },
  );
  if (r.status !== 0)
    throw Error(
      `Prisma ${args[0]} ${args[1] || ""} falhou (saída omitida para proteger credenciais).`,
    );
  return r.stdout;
}
module.exports = {
  root,
  backend,
  sha,
  migrations,
  previewUrl,
  readEnv,
  withDb,
  fingerprint,
  checkHistory,
  prisma,
};
