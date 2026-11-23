// Backup privado e ensaio de restauração da cópia development-seridotour.
// DATABASE_URL deve ser injetada pelo operador, nunca versionada.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { randomBytes } = require('node:crypto');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');
const exec = promisify(execFile);

async function main() {
  const url = new URL(process.env.DATABASE_URL || '');
  assert.equal(url.hostname, 'ep-tiny-bonus-at29rygs.c-9.us-east-1.aws.neon.tech');
  assert.equal(url.pathname, '/northeastour');
  assert.ok(['postgres:', 'postgresql:'].includes(url.protocol));
  assert.ok(['require', 'verify-full'].includes(url.searchParams.get('sslmode')));
  const gate = await fetch('https://seridotour-api-preview.onrender.com/places', { signal: AbortSignal.timeout(15000) });
  assert.equal(gate.status, 503);
  assert.equal((await gate.json()).code, 'PREVIEW_NOT_READY');
  const directory = path.resolve(process.env.PREVIEW_BACKUP_DIR || '');
  assert.ok(process.env.PREVIEW_BACKUP_DIR, 'Informe uma pasta privada fora do Git.');
  // mkdir sem recursive e sem reutilizar diretório existente: não sobrescrever backups.
  await fs.mkdir(directory);
  if (process.platform === 'win32') {
    const identity = (await exec('whoami', [])).stdout.trim();
    await exec('icacls', [directory, '/inheritance:r', '/grant:r', `${identity}:(OI)(CI)F`]);
  } else { await fs.chmod(directory, 0o700); }
  const binary = name => process.env.PG_BIN ? path.join(process.env.PG_BIN, name + (process.platform === 'win32' ? '.exe' : '')) : name;
  const run = async (name, args, env) => {
    try { return (await exec(binary(name), args, { env: { ...process.env, ...env }, maxBuffer: 2 * 1024 * 1024, timeout: 120000, windowsHide: true })).stdout; }
    catch { throw new Error(`Falha na etapa ${name}; saída omitida para proteger dados.`); }
  };
  const dump = path.join(directory, 'development-seridotour.dump');
  const remote = {
    PGHOST: url.hostname, PGPORT: '5432', PGDATABASE: 'northeastour',
    PGUSER: decodeURIComponent(url.username), PGPASSWORD: decodeURIComponent(url.password),
    PGSSLMODE: 'require', PGCONNECT_TIMEOUT: '30',
  };
  await run('pg_dump', ['--format=custom', '--file', dump, '--no-owner', '--no-acl'], remote);
  await run('pg_restore', ['--list', dump], remote);
  const cluster = path.join(directory, 'restore-cluster');
  const passwordFile = path.join(directory, 'restore-password.tmp');
  const localPassword = randomBytes(32).toString('hex');
  await fs.writeFile(passwordFile, localPassword, { mode: 0o600 });
  const net = require('node:net');
  const socket = net.createServer();
  await new Promise((resolve, reject) => { socket.once('error', reject); socket.listen(0, '127.0.0.1', resolve); });
  const port = socket.address().port;
  await new Promise(resolve => socket.close(resolve));
  const local = { PGHOST: '127.0.0.1', PGPORT: String(port), PGUSER: 'preview_restore', PGPASSWORD: localPassword, PGDATABASE: 'postgres', PGSSLMODE: 'disable' };
  let started = false;
  try {
    await run('initdb', ['-D', cluster, '-U', 'preview_restore', '--pwfile', passwordFile, '--auth-host=scram-sha-256', '--auth-local=scram-sha-256', '--encoding=UTF8', '--locale=C'], local);
    await run('pg_ctl', ['-D', cluster, '-l', path.join(directory, 'restore.log'), '-o', `-h 127.0.0.1 -p ${port}`, '-w', 'start'], local);
    started = true;
    await run('createdb', ['restored_preview'], local);
    local.PGDATABASE = 'restored_preview';
    await run('pg_restore', ['--dbname=restored_preview', '--no-owner', '--no-acl', '--exit-on-error', dump], local);
    const sql = `SELECT json_build_object('users',(SELECT count(*) FROM "User"),'tokens',(SELECT count(*) FROM "Token"),'itineraries',(SELECT count(*) FROM "Itinerary"),'reviews',(SELECT count(*) FROM "Review"),'places',(SELECT count(*) FROM "Place"),'links',(SELECT count(*) FROM "_ItineraryToPlace"));`;
    const counts = JSON.parse((await run('psql', ['-X', '-tA', '-c', sql], local)).trim());
    assert.deepEqual(counts, { users: 12, tokens: 11, itineraries: 8, reviews: 4, places: 6, links: 16 });
    const report = { branch: 'development-seridotour', endpoint: url.hostname, database: 'northeastour', createdAt: new Date().toISOString(), restoredLocally: true, counts };
    await fs.writeFile(path.join(directory, 'verification.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify({ backup: dump, restoredLocally: true, counts }));
  } finally {
    if (started) await run('pg_ctl', ['-D', cluster, '-m', 'fast', '-w', 'stop'], local);
    await fs.rm(passwordFile, { force: true });
    // Remove somente o cluster descartável recém-criado dentro do backup escolhido.
    assert.equal(path.dirname(path.resolve(cluster)), directory);
    if (path.basename(cluster) !== 'restore-cluster') throw new Error('Diretório temporário inesperado.');
    await fs.rm(cluster, { recursive: true, force: true });
  }
}
main().catch(() => {
  console.error('Backup/restauração não concluídos; a limpeza deve permanecer bloqueada. Verifique a pasta privada e os binários PostgreSQL.');
  process.exitCode = 1;
});
