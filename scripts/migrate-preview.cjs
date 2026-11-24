// No dotenv fallback and no production URL. Dry run unless --apply is explicit.
const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const {
  sha,
  migrations,
  previewUrl,
  readEnv,
  withDb,
  fingerprint,
  checkHistory,
  prisma,
} = require("./migration-tools.cjs");
async function main() {
  if (!process.env.PREVIEW_SOURCE_ENV)
    throw Error("Informe PREVIEW_SOURCE_ENV privado.");
  const url = previewUrl(readEnv(process.env.PREVIEW_SOURCE_ENV).DATABASE_URL);
  const evidenceFile = path.join(
    path.dirname(process.env.PREVIEW_SOURCE_ENV),
    "migration-verification.json",
  );
  const evidence = JSON.parse(fs.readFileSync(evidenceFile, "utf8"));
  assert.equal(evidence.source, "development-seridotour");
  assert.ok(
    evidence.restoredDataUnchanged &&
      evidence.freshDatabase &&
      evidence.legacyRollback &&
      evidence.e2e &&
      evidence.seedIdempotent &&
      evidence.dockerRuntime,
  );
  assert.ok(
    Date.now() - Date.parse(evidence.verifiedAt) < 24 * 60 * 60 * 1000,
    "Refaça o ensaio após 24 horas.",
  );
  assert.deepEqual(evidence.migrations, migrations());
  assert.equal(sha(fs.readFileSync(evidence.backup)), evidence.backupSha256);
  const alreadyApplied = await withDb(url.href, async (db) => {
    const count = await db.$queryRawUnsafe(
      'SELECT count(*)::int AS count FROM "_prisma_migrations"',
    );
    if (count[0].count === 5) {
      await checkHistory(db, 5);
      return true;
    }
    await checkHistory(db, 4);
    return false;
  });
  if (alreadyApplied) {
    prisma(
      [
        "migrate",
        "diff",
        "--from-url",
        url.href,
        "--to-schema-datamodel",
        "prisma/schema.prisma",
        "--exit-code",
      ],
      url.href,
    );
    return console.log(
      "Migração já aplicada e schema compatível; nenhuma alteração executada.",
    );
  }
  const before = await withDb(url.href, fingerprint);
  assert.deepEqual(
    before,
    evidence.before,
    "Dados mudaram desde o backup; refaça a restauração de ensaio.",
  );
  console.log(
    "Destino e backup restaurado validados: somente development-seridotour.",
  );
  if (!process.argv.includes("--apply"))
    return console.log(
      "Simulação concluída. --apply executa somente a migração complementar revisada.",
    );
  prisma(["migrate", "deploy"], url.href);
  prisma(
    [
      "migrate",
      "diff",
      "--from-url",
      url.href,
      "--to-schema-datamodel",
      "prisma/schema.prisma",
      "--exit-code",
    ],
    url.href,
  );
  await withDb(url.href, async (db) => {
    await checkHistory(db, 5);
    assert.deepEqual(await fingerprint(db), before);
  });
  fs.writeFileSync(
    path.join(path.dirname(evidenceFile), "migration-applied.json"),
    JSON.stringify(
      {
        appliedAt: new Date().toISOString(),
        target: "development-seridotour",
        migrations: migrations(),
        dataUnchanged: true,
      },
      null,
      2,
    ),
  );
  console.log(
    "Cinco migrações registradas; schema compatível e todos os dados preservados.",
  );
}
main().catch(() => {
  console.error(
    "Migração recusada ou não concluída. Confira destino, histórico e evidência de restauração. Nenhuma correção automática será tentada.",
  );
  process.exitCode = 1;
});
