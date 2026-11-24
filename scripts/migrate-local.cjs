const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { createRequire } = require("node:module");
const { assertLocalDatabase } = require("./local-database.cjs");

try {
  assertLocalDatabase(process.env.DATABASE_URL);
  const backend = createRequire(
    path.join(__dirname, "../apps/backend/package.json"),
  );
  const result = spawnSync(
    process.execPath,
    [backend.resolve("prisma/build/index.js"), "migrate", "deploy"],
    {
      cwd: path.join(__dirname, "../apps/backend"),
      env: process.env,
      stdio: "inherit",
      windowsHide: true,
    },
  );
  process.exitCode = result.status ?? 1;
} catch {
  console.error(
    "Migração recusada: informe explicitamente DATABASE_URL de um banco local autorizado.",
  );
  process.exitCode = 1;
}
