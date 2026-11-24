// Operação administrativa fora da API pública. Não carrega .env implicitamente.
const fs = require("node:fs");
const path = require("node:path");
const { randomUUID } = require("node:crypto");
const { previewUrl, readEnv, withDb, root } = require("./migration-tools.cjs");

function options(args) {
  const parsed = { apply: false };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--apply") parsed.apply = true;
    else if (
      ["--email", "--from", "--to", "--reason"].includes(args[i]) &&
      args[i + 1] &&
      !args[i + 1].startsWith("--")
    )
      parsed[args[i].slice(2)] = args[++i];
    else throw Error("Argumento inválido.");
  }
  if (
    !parsed.email ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parsed.email) ||
    !["USER", "GUIA"].includes(parsed.from) ||
    !["USER", "GUIA"].includes(parsed.to) ||
    parsed.from === parsed.to ||
    !parsed.reason ||
    parsed.reason.length < 10 ||
    parsed.reason.length > 200
  )
    throw Error(
      "Exige --email exato, --from USER|GUIA, --to USER|GUIA e --reason de 10 a 200 caracteres.",
    );
  return parsed;
}

async function planRole(db, change) {
  const user = await db.user.findUnique({
    where: { email: change.email },
    select: { id: true, role: true },
  });
  if (!user) throw Error("Conta não encontrada; o comando não cria contas.");
  if (user.role === change.to)
    return {
      userId: user.id,
      from: user.role,
      to: change.to,
      alreadyApplied: true,
      sessionsToRevoke: 0,
    };
  if (user.role !== change.from)
    throw Error("Papel atual diferente do esperado.");
  if (
    change.from === "GUIA" &&
    (await db.user.count({ where: { role: "GUIA" } })) <= 1
  )
    throw Error("Não revogar o último guia do preview.");
  return {
    userId: user.id,
    from: user.role,
    to: change.to,
    alreadyApplied: false,
    sessionsToRevoke: await db.token.count({ where: { userId: user.id } }),
  };
}

async function applyRole(db, change, expectedPlan) {
  return db.$transaction(
    async (tx) => {
      const current = await planRole(tx, change);
      if (
        current.userId !== expectedPlan.userId ||
        current.from !== expectedPlan.from ||
        current.alreadyApplied !== expectedPlan.alreadyApplied
      )
        throw Error("Conta ou papel mudou após a revisão.");
      if (current.alreadyApplied) return { ...current, sessionsRevoked: 0 };
      const updated = await tx.user.updateMany({
        where: { id: current.userId, role: change.from },
        data: { role: change.to },
      });
      if (updated.count !== 1) throw Error("Papel mudou durante a operação.");
      const revoked = await tx.token.deleteMany({
        where: { userId: current.userId },
      });
      return { ...current, sessionsRevoked: revoked.count };
    },
    { isolationLevel: "Serializable" },
  );
}

async function main() {
  const change = options(process.argv.slice(2));
  if (!process.env.PREVIEW_SOURCE_ENV)
    throw Error("Informe PREVIEW_SOURCE_ENV privado.");
  const url = previewUrl(readEnv(process.env.PREVIEW_SOURCE_ENV).DATABASE_URL);
  await withDb(url.href, async (db) => {
    const plan = await planRole(db, change);
    console.log(
      JSON.stringify({
        target: "development-seridotour",
        mode: change.apply ? "apply" : "dry-run",
        ...plan,
      }),
    );
    if (!change.apply || plan.alreadyApplied) return;
    // Auditoria privada fora do repositório; um arquivo novo por operação.
    if (!process.env.PREVIEW_GUIDE_AUDIT_DIR)
      throw Error("Exige PREVIEW_GUIDE_AUDIT_DIR privado.");
    const dir = fs.realpathSync(process.env.PREVIEW_GUIDE_AUDIT_DIR);
    const relative = path.relative(fs.realpathSync(root), dir);
    if (
      !relative ||
      (!relative.startsWith(".." + path.sep) && !path.isAbsolute(relative))
    )
      throw Error("Auditoria deve ficar fora do repositório.");
    const file = path.join(dir, "guide-role-" + randomUUID() + ".json");
    const record = {
      target: "development-seridotour",
      at: new Date().toISOString(),
      reason: change.reason,
      plan,
      phase: "prepared",
    };
    fs.writeFileSync(file, JSON.stringify(record, null, 2), {
      flag: "wx",
      mode: 0o600,
    });
    try {
      const result = await applyRole(db, change, plan);
      fs.writeFileSync(
        file,
        JSON.stringify({ ...record, phase: "applied", result }, null, 2),
      );
      console.log(
        "Papel alterado e sessões revogadas na mesma transação. Exige novo login.",
      );
    } catch {
      // Não repetir uma escrita se o resultado do commit for incerto.
      fs.writeFileSync(
        file,
        JSON.stringify({ ...record, phase: "uncertain-or-rejected" }, null, 2),
      );
      throw Error(
        "Operação não confirmada; consultar papel atual e recibo antes de repetir.",
      );
    }
  });
}
if (require.main === module)
  main().catch(() => {
    console.error(
      "Operação recusada ou não confirmada. Confira destino, conta, papéis e auditoria privada.",
    );
    process.exitCode = 1;
  });
module.exports = { options, planRole, applyRole };
