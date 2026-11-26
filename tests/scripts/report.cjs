const fs = require('node:fs');
const path = require('node:path');

function writeReport(suite, report) {
  const dir = path.resolve(__dirname, '../reports', suite);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'results.json'), JSON.stringify(report, null, 2) + '\n');
  const cell = (value) => String(value ?? '').replace(/\|/g, '\\|').replace(/\r?\n/g, '<br>');
  const count = (status) => report.tests.filter((test) => test.status === status).length;
  const lines = [
    `# Relatório de testes: ${suite}`, '',
    `Execução: ${report.executedAt} (America/Sao_Paulo).`, '',
    `Ambiente: Node ${process.version}; ${process.platform}/${process.arch}.`, '',
    `Total: ${report.tests.length}; aprovados: ${count('passed')}; reprovados: ${count('failed')}; pendentes: ${report.tests.length - count('passed') - count('failed')}.`, '',
    `Situação da execução: **${report.success ? 'APROVADA' : 'REPROVADA'}**.`, '',
    report.scope, '',
    '| Caso | Arquivo | Resultado | Duração (ms) |',
    '| --- | --- | --- | ---: |',
    ...report.tests.map((test) => `| ${cell(test.name)} | ${cell(test.file)} | ${cell(test.status)} | ${test.durationMs ?? '—'} |`),
  ];
  if (report.error) lines.push('', '## Falha de execução', '', '```text', report.error, '```');
  for (const test of report.tests.filter((test) => test.error)) {
    lines.push('', `## ${test.name}`, '', '```text', test.error, '```');
  }
  fs.writeFileSync(path.join(dir, 'RELATORIO.md'), lines.join('\n') + '\n');
}

function executedAt() {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'America/Sao_Paulo', dateStyle: 'short', timeStyle: 'medium',
  }).format(new Date());
}

module.exports = { writeReport, executedAt };
