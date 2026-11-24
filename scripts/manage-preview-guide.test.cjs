const { test } = require("node:test");
const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { randomUUID } = require("node:crypto");
const { options } = require("./manage-preview-guide.cjs");
test("concessão exige alvo, papel esperado, motivo e apply explícito", () => {
  assert.throws(() => options(["--email", "one@example.test", "--to", "GUIA"]));
  assert.throws(() =>
    options([
      "--email",
      "one@example.test",
      "--from",
      "USER",
      "--to",
      "ADMIN",
      "--reason",
      "motivo de teste",
    ]),
  );
  assert.equal(
    options([
      "--email",
      "one@example.test",
      "--from",
      "USER",
      "--to",
      "GUIA",
      "--reason",
      "motivo de teste",
    ]).apply,
    false,
  );
});
test("comando recusa destino remoto diferente antes de conectar e sem expor a URL", () => {
  const file = path.join(
    os.tmpdir(),
    "seridotour-refused-role-" + randomUUID() + ".env",
  );
  fs.writeFileSync(
    file,
    "DATABASE_URL=postgresql://test:private-dummy-marker@production.invalid/northeastour?sslmode=require\n",
    { flag: "wx", mode: 0o600 },
  );
  try {
    const r = spawnSync(
      process.execPath,
      [
        require.resolve("./manage-preview-guide.cjs"),
        "--email",
        "one@example.test",
        "--from",
        "USER",
        "--to",
        "GUIA",
        "--reason",
        "motivo de teste",
        "--apply",
      ],
      { env: { ...process.env, PREVIEW_SOURCE_ENV: file }, encoding: "utf8" },
    );
    assert.equal(r.status, 1);
    assert.doesNotMatch(
      r.stdout + r.stderr,
      /postgresql:\/\/|private-dummy-marker/,
    );
  } finally {
    fs.unlinkSync(file);
  }
});
