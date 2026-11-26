const { spawnSync } = require('node:child_process');
const path = require('node:path');
const { writeReport, executedAt } = require('./report.cjs');

const root = path.resolve(__dirname, '..');
const backend = path.resolve(root, '../apps/backend');
const prisma = path.join(path.dirname(require.resolve('prisma/package.json', { paths: [backend] })), 'build/index.js');

// Gera somente o client usado pelo back-end, sem conectar nem alterar o banco.
// A configuração do Prisma exige DATABASE_URL até para gerar tipos.
const generated = spawnSync(process.execPath, [prisma, 'generate'], {
  cwd: backend,
  env: { ...process.env, DATABASE_URL: 'postgresql://tests:tests@127.0.0.1:5432/northeastour_unit' },
  encoding: 'utf8',
  windowsHide: true,
});

if (generated.status !== 0) {
  const error = generated.error?.stack || `${generated.stdout || ''}\n${generated.stderr || ''}`;
  console.error(error);
  writeReport('backend', {
    executedAt: executedAt(), success: false, tests: [], error,
    scope: 'Preparação do Prisma Client falhou; os testes unitários não foram executados.',
  });
  process.exitCode = 1;
} else {
  const result = spawnSync(process.execPath, [require.resolve('jest/bin/jest'), '--config', 'config/jest.backend.cjs', '--runInBand', '--coverage'], {
    cwd: root, stdio: 'inherit', windowsHide: true,
  });
  if (result.error) console.error(result.error);
  process.exitCode = result.status === 0 ? 0 : 1;
}
