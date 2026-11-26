const fs = require('node:fs');
const path = require('node:path');
const { executedAt } = require('./report.cjs');

const root = path.resolve(__dirname, '../reports');
const suites = ['backend', 'frontend', 'cypress'];
const lines = [
  '# Relatório geral de testes', '',
  `Consolidado em ${executedAt()} (America/Sao_Paulo). Cada relatório conserva a data da sua execução.`, '',
  '| Suíte | Total | Aprovados | Reprovados | Pendentes | Linhas cobertas¹ | Relatório por caso |',
  '| --- | ---: | ---: | ---: | ---: | ---: | --- |',
];
let total = 0;
let passed = 0;
let failed = 0;
let pending = 0;
const failures = [];
for (const suite of suites) {
  const file = path.join(root, suite, 'results.json');
  if (!fs.existsSync(file)) {
    lines.push(`| ${suite} | — | — | — | não executado | — | — |`);
    continue;
  }
  const report = JSON.parse(fs.readFileSync(file, 'utf8'));
  const approved = report.tests.filter((test) => test.status === 'passed').length;
  const rejected = report.tests.filter((test) => test.status === 'failed').length;
  const skipped = report.tests.length - approved - rejected;
  let coverage = 'não medida';
  const coverageFile = path.join(root, suite, 'coverage/coverage-summary.json');
  if (fs.existsSync(coverageFile) && report.tests.length) {
    const summary = JSON.parse(fs.readFileSync(coverageFile, 'utf8'));
    coverage = `${summary.total.lines.pct}%`;
    const portable = Object.fromEntries(Object.entries(summary).map(([file, value]) => [
      file === 'total' ? file : path.relative(path.resolve(__dirname, '../..'), file).replace(/\\/g, '/'), value,
    ]));
    fs.writeFileSync(path.join(root, suite, 'coverage-summary.json'), JSON.stringify(portable, null, 2) + '\n');
  }
  lines.push(`| ${suite} | ${report.tests.length} | ${approved} | ${rejected} | ${skipped} | ${coverage} | [Abrir](${suite}/RELATORIO.md) |`);
  total += report.tests.length;
  passed += approved;
  failed += rejected;
  pending += skipped;
  for (const test of report.tests.filter((test) => test.status === 'failed')) failures.push(`- **${test.name}** — ${test.file}. Consulte a evidência no relatório da suíte.`);
  if (report.error) failures.push(`- Falha de execução em **${suite}**: consulte o relatório da suíte.`);
}
lines.push('', `**Total: ${total} casos; ${passed} aprovados; ${failed} reprovados; ${pending} pendentes.**`, '',
  '¹ Cobertura somente dos arquivos selecionados em `config/jest.*.cjs`; não representa toda a aplicação. Resumos de cobertura versionados em cada suíte; HTML completo gerado localmente em `coverage/index.html`.', '',
  '## Resultados que exigem atenção', '',
  ...(failures.length ? failures : ['Nenhuma reprovação registrada nos relatórios disponíveis.']), '',
  '## Observações da análise', '',
  '- A integração beta usa `ArrayNotEmpty` para recusar roteiros sem destinos na criação e na edição. UUIDs válidos v4/v5 são aceitos em roteiros e avaliações, incluindo os IDs do catálogo importado.',
  '- A sessão mantém o contrato compatível de `access_token`, renovado com rotação e revogação. Os testes foram atualizados para esse contrato e para cadastro público exclusivamente USER. Access e refresh separados continuam como evolução pendente, sem reintroduzir o código compartilhado de guia.', '',
  '## Limites da execução', '',
  '- Jest do back-end usa mocks de Prisma, cache, bcrypt, JWT e provedores. Não mede comportamento do PostgreSQL, constraints, autenticação HTTP ou uploads reais.',
  '- Jest do front-end utiliza jsdom, Vue Test Utils e Pinia. A API de dialog é simulada no setup.',
  '- Cypress executa a aplicação Vue no Electron headless com API interceptada. Os JWTs são fictícios e não validam assinatura. Não cobre integração real entre front-end e back-end, mapas externos, navegadores adicionais ou auditoria completa de acessibilidade.',
  '- O ensaio separado `npm run verify:migrations` cobre PostgreSQL descartável, HTTP real e imagens de execução; seus resultados constam na auditoria final e não entram nas contagens unitárias desta tabela.',
  '- A suíte completa retorna código de saída 1 enquanto houver reprovação. Nenhum caso é marcado como aprovado quando falha.', '',
  '## Como reproduzir', '',
  'Na raiz do repositório: `npm ci` e `npm test`. Comandos separados e escopo dos casos: [README](../README.md) e [plano](../PLANO-DE-TESTES.md).', '',
);
fs.mkdirSync(root, { recursive: true });
fs.writeFileSync(path.join(root, 'RELATORIO-GERAL.md'), lines.join('\n'));
