// PostgreSQL descartável, sem modificar serviços Docker ou bancos existentes.
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const crypto = require("node:crypto");
const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const {
  backend,
  sha,
  migrations,
  previewUrl,
  readEnv,
  withDb,
  fingerprint,
  checkHistory,
  prisma,
} = require("./migration-tools.cjs");
const id = "seridotour-migrations-" + crypto.randomBytes(6).toString("hex");
const password = crypto.randomBytes(24).toString("hex");
const work = fs.mkdtempSync(path.join(os.tmpdir(), "seridotour-migrations-"));
let started = false;
let apiStarted = false;
function docker(args, { input, allowFailure = false } = {}) {
  const r = spawnSync("docker", args, {
    encoding: "utf8",
    input,
    maxBuffer: 8 * 1024 * 1024,
  });
  if (r.status !== 0 && !allowFailure)
    throw Error(`Docker ${args[0]} falhou (saída omitida).`);
  return r;
}
function sql(db, text, allowFailure = false) {
  return docker(
    [
      "exec",
      "-i",
      id,
      "psql",
      "-At",
      "-U",
      "postgres",
      "-d",
      db,
      "-v",
      "ON_ERROR_STOP=1",
    ],
    { input: text, allowFailure },
  );
}
async function main() {
  const sourceFile = process.env.PREVIEW_SOURCE_ENV;
  let source;
  if (sourceFile) source = previewUrl(readEnv(sourceFile).DATABASE_URL);
  const envFile = path.join(work, "postgres.env");
  fs.writeFileSync(envFile, `POSTGRES_PASSWORD=${password}\n`, { mode: 0o600 });
  docker([
    "run",
    "-d",
    "--name",
    id,
    "--label",
    `seridotour.migration-owner=${id}`,
    "--env-file",
    envFile,
    "-p",
    "127.0.0.1::5432",
    "postgres:18-alpine",
  ]);
  started = true;
  for (let i = 0; i < 60; i++) {
    if (
      docker(["exec", id, "pg_isready", "-U", "postgres"], {
        allowFailure: true,
      }).status === 0
    )
      break;
    await new Promise((r) => setTimeout(r, 1000));
    if (i === 59) throw Error("PostgreSQL local não iniciou.");
  }
  const port = docker(["port", id, "5432/tcp"]).stdout.trim().split(":").pop();
  const url = (db) =>
    `postgresql://postgres:${password}@127.0.0.1:${port}/${db}?schema=public`;
  for (const db of [
    "seridotour_test_fresh",
    "seridotour_test_clone",
    "seridotour_test_legacy",
  ])
    sql("postgres", `CREATE DATABASE "${db}";`);
  console.log("PostgreSQL 18 descartável iniciado; testando banco vazio.");
  prisma(["migrate", "deploy"], url("seridotour_test_fresh"));
  prisma(["migrate", "deploy"], url("seridotour_test_fresh"));
  prisma(
    [
      "migrate",
      "diff",
      "--from-url",
      url("seridotour_test_fresh"),
      "--to-schema-datamodel",
      "prisma/schema.prisma",
      "--exit-code",
    ],
    url("seridotour_test_fresh"),
  );
  await withDb(url("seridotour_test_fresh"), (db) => checkHistory(db, 5));
  // Banco antigo com vínculo real: a migração deve falhar e reverter tudo.
  const names = Object.keys(migrations());
  for (const n of names.slice(0, 4))
    sql(
      "seridotour_test_legacy",
      fs.readFileSync(
        path.join(backend, "prisma/migrations", n, "migration.sql"),
        "utf8",
      ),
    );
  sql(
    "seridotour_test_legacy",
    `INSERT INTO "User" (id,name,email,password) VALUES ('u','Local','local@example.test','test-only'); INSERT INTO "Place" (id,name,city) VALUES ('p','Local','Local'); INSERT INTO "Itinerary" (id,title,"userId") VALUES ('i','Local','u'); INSERT INTO "ItineraryPlace" (id,"itineraryId","placeId") VALUES ('l','i','p');`,
  );
  assert.notEqual(
    sql(
      "seridotour_test_legacy",
      fs.readFileSync(
        path.join(backend, "prisma/migrations", names[4], "migration.sql"),
        "utf8",
      ),
      true,
    ).status,
    0,
  );
  assert.equal(
    sql(
      "seridotour_test_legacy",
      'SELECT count(*) FROM "ItineraryPlace";',
    ).stdout.trim(),
    "1",
  );
  assert.equal(
    sql(
      "seridotour_test_legacy",
      `SELECT count(*) FROM information_schema.columns WHERE table_name='User' AND column_name='role';`,
    ).stdout.trim(),
    "0",
  );
  sql("seridotour_test_legacy", 'DELETE FROM "ItineraryPlace";');
  assert.notEqual(
    sql(
      "seridotour_test_legacy",
      fs.readFileSync(
        path.join(backend, "prisma/migrations", names[4], "migration.sql"),
        "utf8",
      ),
      true,
    ).status,
    0,
  );
  assert.equal(
    sql(
      "seridotour_test_legacy",
      'SELECT count(*) FROM "Place";',
    ).stdout.trim(),
    "1",
  );
  assert.equal(
    sql(
      "seridotour_test_legacy",
      `SELECT count(*) FROM information_schema.columns WHERE table_name='User' AND column_name='role';`,
    ).stdout.trim(),
    "0",
  );
  console.log(
    "Histórico completo reproduzido; vínculo legado bloqueou a migração com rollback.",
  );
  const fixture = path.join(
    __dirname,
    "fixtures/preview-schema-before-reconcile.sql",
  );
  let backup, before;
  if (source) {
    await withDb(source.href, async (db) => {
      const rows = await db.$queryRawUnsafe(
        'SELECT count(*)::int AS count FROM "_prisma_migrations"',
      );
      assert.ok([4, 5].includes(rows[0].count));
      await checkHistory(db, rows[0].count);
      before = await fingerprint(db);
    });
    const pgEnv = path.join(work, "source.env");
    fs.writeFileSync(
      pgEnv,
      `PGHOST=${source.hostname}\nPGPORT=5432\nPGDATABASE=northeastour\nPGUSER=${decodeURIComponent(source.username)}\nPGPASSWORD=${decodeURIComponent(source.password)}\nPGSSLMODE=require\n`,
      { mode: 0o600 },
    );
    docker([
      "exec",
      "--env-file",
      pgEnv,
      id,
      "pg_dump",
      "--format=custom",
      "--no-owner",
      "--no-acl",
      "--file=/tmp/preview.dump",
    ]);
    backup = path.join(
      path.dirname(sourceFile),
      "preview-before-reconcile.dump",
    );
    docker(["cp", `${id}:/tmp/preview.dump`, backup]);
    docker([
      "exec",
      id,
      "pg_restore",
      "-U",
      "postgres",
      "--dbname=seridotour_test_clone",
      "--no-owner",
      "--no-acl",
      "--exit-on-error",
      "/tmp/preview.dump",
    ]);
    // Only schema is versioned. pg_dump contains no roles/passwords or table rows.
    const schema = docker([
      "exec",
      id,
      "pg_dump",
      "-U",
      "postgres",
      "-d",
      "seridotour_test_clone",
      "--schema-only",
      "--no-owner",
      "--no-acl",
    ]).stdout;
    fs.mkdirSync(path.dirname(fixture), { recursive: true });
    fs.writeFileSync(
      fixture,
      schema.replace(/^\\(?:un)?restrict .*\r?\n/gm, "").trimEnd() + "\n",
    );
  } else {
    sql("seridotour_test_clone", fs.readFileSync(fixture, "utf8"));
    for (const n of names.slice(0, 4))
      prisma(
        ["migrate", "resolve", "--applied", n],
        url("seridotour_test_clone"),
      );
    before = await withDb(url("seridotour_test_clone"), fingerprint);
  }
  assert.deepEqual(
    await withDb(url("seridotour_test_clone"), fingerprint),
    before,
  );
  prisma(["migrate", "deploy"], url("seridotour_test_clone"));
  prisma(["migrate", "deploy"], url("seridotour_test_clone"));
  prisma(
    [
      "migrate",
      "diff",
      "--from-url",
      url("seridotour_test_clone"),
      "--to-schema-datamodel",
      "prisma/schema.prisma",
      "--exit-code",
    ],
    url("seridotour_test_clone"),
  );
  await withDb(url("seridotour_test_clone"), async (db) => {
    await checkHistory(db, 5);
    assert.deepEqual(await fingerprint(db), before);
  });
  const evidence = {
    verifiedAt: new Date().toISOString(),
    source: source ? "development-seridotour" : "schema-fixture",
    migrations: migrations(),
    before,
    restoredDataUnchanged: true,
    freshDatabase: true,
    legacyRollback: true,
    ...(backup ? { backup, backupSha256: sha(fs.readFileSync(backup)) } : {}),
  };
  console.log(
    "Cópia restaurada e migrada sem alterar dados; segunda execução sem mudanças; schema sem diferenças.",
  );
  const jest = require("node:module")
    .createRequire(path.join(backend, "package.json"))
    .resolve("jest/bin/jest");
  const tests = spawnSync(
    process.execPath,
    [jest, "--config", "test/jest-e2e.json", "--runInBand"],
    {
      cwd: backend,
      env: { ...process.env, TEST_DATABASE_URL: url("seridotour_test_fresh") },
      encoding: "utf8",
      maxBuffer: 4 * 1024 * 1024,
    },
  );
  // This test uses only generated local credentials and synthetic data.
  process.stdout.write(tests.stdout || "");
  process.stderr.write(tests.stderr || "");
  if (tests.status !== 0) throw Error("E2E com PostgreSQL local falhou.");
  sql("postgres", "CREATE DATABASE seridotour_test_demo;");
  const demo = url("seridotour_test_demo");
  prisma(["migrate", "deploy"], demo);
  const seed = () => {
    const r = spawnSync(
      process.execPath,
      [
        require("node:module")
          .createRequire(path.join(backend, "package.json"))
          .resolve("prisma/build/index.js"),
        "db",
        "seed",
      ],
      {
        cwd: backend,
        env: {
          ...process.env,
          DATABASE_URL: demo,
          LOCAL_DEMO_PASSWORD: password,
        },
        encoding: "utf8",
      },
    );
    if (r.status !== 0) throw Error("Seed local falhou.");
  };
  seed();
  const seeded = await withDb(demo, fingerprint);
  seed();
  assert.deepEqual(await withDb(demo, fingerprint), seeded);
  assert.equal(seeded.User.count, 1);
  assert.equal(seeded.Place.count, 2);
  assert.equal(seeded.Itinerary.count, 1);
  assert.equal(seeded.Review.count, 0);
  console.log(
    "Seed local repetido sem duplicações: 1 usuário, 2 locais, 1 rascunho, zero avaliações.",
  );
  for (const image of [
    process.env.VERIFY_BACKEND_IMAGE,
    process.env.VERIFY_NATIVE_BACKEND_IMAGE,
  ].filter(Boolean)) {
    const state = await withDb(url("seridotour_test_fresh"), fingerprint);
    const apiEnv = path.join(work, "api.env");
    fs.writeFileSync(
      apiEnv,
      `DATABASE_URL=postgresql://postgres:${password}@127.0.0.1:5432/seridotour_test_fresh\nNODE_ENV=production\nJWT_SECRET=${crypto.randomBytes(32).toString("hex")}\nJWT_EXPIRES_IN=15m\nCLOUDINARY_CLOUD_NAME=test-only\nCLOUDINARY_API_KEY=test-only\nCLOUDINARY_API_SECRET=test-only\nENABLE_SWAGGER=false\n`,
      { mode: 0o600 },
    );
    docker([
      "run",
      "-d",
      "--name",
      id + "-api",
      "--label",
      `seridotour.migration-owner=${id}`,
      "--network",
      `container:${id}`,
      "--env-file",
      apiEnv,
      image,
    ]);
    apiStarted = true;
    let ready = false;
    for (let i = 0; i < 45; i++) {
      const r = docker(
        [
          "exec",
          id + "-api",
          "node",
          "-e",
          "fetch('http://127.0.0.1:3000/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))",
        ],
        { allowFailure: true },
      );
      if (r.status === 0) {
        ready = true;
        break;
      }
      await new Promise((r) => setTimeout(r, 1000));
    }
    assert.ok(ready, "Imagem backend não respondeu /health.");
    assert.deepEqual(
      await withDb(url("seridotour_test_fresh"), fingerprint),
      state,
    );
    assert.equal(
      docker(["exec", id + "-api", "id", "-u"]).stdout.trim(),
      "1000",
    );
    console.log(
      "Imagem backend executada sem root, /health 200 e nenhum dado alterado na inicialização.",
    );
    docker(["rm", "-f", "-v", id + "-api"]);
    apiStarted = false;
  }
  if (sourceFile)
    fs.writeFileSync(
      path.join(path.dirname(sourceFile), "migration-verification.json"),
      JSON.stringify(
        {
          ...evidence,
          e2e: true,
          seedIdempotent: true,
          dockerRuntime: !!process.env.VERIFY_BACKEND_IMAGE,
        },
        null,
        2,
      ),
    );
}
main()
  .catch((error) => {
    console.error(
      "Verificação não concluída; nenhum banco remoto foi modificado. " +
        String(error.message).replace(
          /postgres(?:ql)?:\/\/\S+/g,
          "[conexão omitida]",
        ),
    );
    process.exitCode = 1;
  })
  .finally(() => {
    if (
      apiStarted &&
      docker(
        [
          "inspect",
          "--format",
          '{{ index .Config.Labels "seridotour.migration-owner" }}',
          id + "-api",
        ],
        { allowFailure: true },
      ).stdout.trim() === id
    )
      docker(["rm", "-f", "-v", id + "-api"], { allowFailure: true });
    if (
      started &&
      docker(
        [
          "inspect",
          "--format",
          '{{ index .Config.Labels "seridotour.migration-owner" }}',
          id,
        ],
        { allowFailure: true },
      ).stdout.trim() === id
    )
      docker(["rm", "-f", "-v", id], { allowFailure: true });
    // Only the newly created task directory, checked against the OS temp root.
    const target = fs.realpathSync(work),
      base = fs.realpathSync(os.tmpdir());
    if (
      path.dirname(target) === base &&
      path.basename(target).startsWith("seridotour-migrations-")
    )
      fs.rmSync(target, { recursive: true, force: true });
  });
