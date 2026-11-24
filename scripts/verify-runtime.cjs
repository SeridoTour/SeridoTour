// Verifica o artefato após o prune; não conecta a nenhum banco ou serviço.
const { createRequire } = require("node:module");
const path = require("node:path");
const backend = createRequire(
  path.join(__dirname, "../apps/backend/package.json"),
);
for (const name of [
  "prisma",
  "@prisma/config",
  "@nestjs/cli",
  "jest",
  "typescript",
]) {
  let present = false;
  try {
    backend.resolve(name);
    present = true;
  } catch (error) {
    if (error.code !== "MODULE_NOT_FOUND") throw error;
  }
  if (present)
    throw Error("Ferramenta de build encontrada no runtime: " + name);
}
for (const name of ["@nestjs/core", "@nestjs/platform-express", "bcrypt"])
  backend.resolve(name);
const { PrismaClient, Prisma } = backend("@prisma/client");
if (Prisma.prismaVersion.client !== "6.19.3")
  throw Error("Client Prisma divergente.");
const client = new PrismaClient();
client
  .$disconnect()
  .then(() =>
    console.log(
      "Runtime validado: client Prisma gerado e dependências da API presentes; ferramentas de build ausentes.",
    ),
  )
  .catch(() => {
    console.error("Runtime não validado.");
    process.exitCode = 1;
  });
