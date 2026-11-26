const { spawnSync } = require('node:child_process');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const runs = [
  [path.join(__dirname, 'run-backend.cjs')],
  [require.resolve('jest/bin/jest'), '--config', 'config/jest.frontend.cjs', '--runInBand', '--coverage'],
  [path.join(__dirname, 'run-cypress.cjs')],
];
let failed = false;
for (const args of runs) {
  const result = spawnSync(process.execPath, args, { cwd: root, stdio: 'inherit' });
  if (result.error) console.error(result.error);
  if (result.status !== 0) failed = true;
}
require('./summarize.cjs');
process.exitCode = failed ? 1 : 0;
