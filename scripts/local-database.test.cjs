const { test } = require("node:test");
const assert = require("node:assert/strict");
const { assertLocalDatabase } = require("./local-database.cjs");

test("recusa Neon e qualquer destino remoto, inclusive development-seridotour", () => {
  assert.throws(() =>
    assertLocalDatabase(
      "postgresql://user:password@ep-tiny-bonus-at29rygs.c-9.us-east-1.aws.neon.tech/northeastour?sslmode=require",
    ),
  );
});
test("recusa seed em banco local normal e aceita somente demonstração/teste", () => {
  assert.throws(() =>
    assertLocalDatabase(
      "postgresql://user:password@localhost/seridotour_local",
      { seed: true },
    ),
  );
  assert.equal(
    assertLocalDatabase(
      "postgresql://user:password@127.0.0.1/seridotour_demo",
      { seed: true },
    ).pathname,
    "/seridotour_demo",
  );
});
test("recusa banco genérico mesmo no servidor local", () => {
  assert.throws(() =>
    assertLocalDatabase("postgresql://user:password@localhost/postgres"),
  );
});
