const { spawn } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');
const net = require('node:net');
const cypress = require('cypress');
const { writeReport, executedAt } = require('./report.cjs');

const root = path.resolve(__dirname, '..');
const frontend = path.resolve(root, '../apps/frontend');
const host = '127.0.0.1';
const port = 4175;
const baseUrl = `http://${host}:${port}`;
let server;
let log = '';

async function checkPort() {
  const probe = net.createServer();
  await new Promise((resolve, reject) => {
    probe.once('error', () => reject(new Error(`Porta ${port} ocupada; encerre o processo que a utiliza antes de repetir.`)));
    probe.listen(port, host, resolve);
  });
  await new Promise((resolve) => probe.close(resolve));
}

async function waitForVite() {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) throw new Error(`Vite encerrou: ${log}`);
    try {
      const response = await fetch(baseUrl, { signal: AbortSignal.timeout(1000) });
      if (response.ok) return;
    } catch { /* Aguarda o servidor iniciado por este script. */ }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error(`Vite não ficou disponível em 30 segundos.\n${log}`);
}

async function main() {
  const scope = 'Fluxos de interface em Electron headless, com a aplicação Vue real servida pelo Vite. API interceptada com fixtures e tokens fictícios; não valida integração com NestJS, PostgreSQL ou provedores externos.';
  try {
    await checkPort();
    const vite = path.join(path.dirname(require.resolve('vite/package.json')), 'bin/vite.js');
    server = spawn(process.execPath, [vite, '--host', host, '--port', String(port), '--strictPort'], {
      cwd: frontend,
      windowsHide: true,
      env: { ...process.env, VITE_API_URL: 'http://127.0.0.1:3999' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    server.stdout.on('data', (data) => { log += data; });
    server.stderr.on('data', (data) => { log += data; });
    server.on('error', (error) => { log += error.message; });
    await waitForVite();
    const result = await cypress.run({
      project: root, configFile: 'cypress.config.cjs', browser: 'electron',
      config: { baseUrl },
    });
    if (!('runs' in result)) throw new Error(result.message || JSON.stringify(result));
    writeReport('cypress', {
      executedAt: executedAt(), scope,
      success: result.totalFailed === 0 && result.totalTests > 0 && !result.runs.some((run) => run.error),
      browser: result.browserName, browserVersion: result.browserVersion, cypressVersion: result.cypressVersion,
      error: result.runs.filter((run) => run.error).map((run) => run.error).join('\n') || undefined,
      tests: result.runs.flatMap((run) => run.tests.map((test) => ({
        name: test.title.join(' › '),
        file: run.spec.relative.replace(/\\/g, '/'),
        status: test.state,
        durationMs: test.duration ?? test.attempts.reduce((total, attempt) => total + (attempt.wallClockDuration || 0), 0),
        error: test.displayError || undefined,
      }))),
    });
    if (result.totalFailed || !result.totalTests || result.runs.some((run) => run.error)) process.exitCode = 1;
  } catch (error) {
    console.error(error);
    writeReport('cypress', { executedAt: executedAt(), scope, success: false, tests: [], error: error.stack || String(error) });
    process.exitCode = 1;
  } finally {
    if (server && server.exitCode === null) {
      server.kill();
      await new Promise((resolve) => server.once('exit', resolve));
    }
    const reports = path.join(root, 'reports/cypress');
    fs.mkdirSync(reports, { recursive: true });
    fs.writeFileSync(path.join(reports, 'vite.log'), log);
  }
}

main();
