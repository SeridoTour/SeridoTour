const assert = require("node:assert/strict");

function assertLocalDatabase(value, { seed = false } = {}) {
  const url = new URL(value || "");
  assert.ok(
    ["postgres:", "postgresql:"].includes(url.protocol),
    "PostgreSQL obrigatório.",
  );
  assert.ok(
    ["localhost", "127.0.0.1", "[::1]", "postgres"].includes(url.hostname),
    "Operação permitida somente em PostgreSQL local.",
  );
  const database = decodeURIComponent(url.pathname.slice(1));
  assert.ok(
    database === "seridotour_local" ||
      database === "seridotour_demo" ||
      /^seridotour_test_[a-z0-9_]+$/.test(database),
    "Use um banco local identificado como seridotour_local, seridotour_demo ou seridotour_test_*.",
  );
  if (seed)
    assert.ok(
      database === "seridotour_demo" || database.startsWith("seridotour_test_"),
      "Seed somente em banco descartável de demonstração/teste.",
    );
  return url;
}
module.exports = { assertLocalDatabase };
