const path = require('node:path');
const { writeReport, executedAt } = require('./report.cjs');

module.exports = class JestReport {
  constructor(_config, options) { this.suite = options.suite; }

  onRunComplete(_contexts, results) {
    const root = path.resolve(__dirname, '../..');
    writeReport(this.suite, {
      executedAt: executedAt(),
      scope: this.suite === 'backend'
        ? 'Testes unitários Jest com banco, cache, JWT, bcrypt e serviços externos substituídos por mocks. Não valida banco real ou endpoints HTTP.'
        : 'Testes Jest de stores Pinia, serviços, utilitários e componentes Vue em jsdom. Não valida renderização em navegador real.',
      // Jest ainda não finalizou results.success durante onRunComplete.
      success: results.numFailedTests === 0 && results.numFailedTestSuites === 0
        && results.numPassedTests > 0 && results.numPendingTests === 0 && !results.wasInterrupted,
      error: results.testResults.filter((result) => result.testExecError).map((result) => result.failureMessage).join('\n') || undefined,
      tests: results.testResults.flatMap((result) => result.testResults.map((test) => ({
        name: test.fullName,
        file: path.relative(root, result.testFilePath).replace(/\\/g, '/'),
        status: test.status,
        durationMs: test.duration,
        error: test.failureMessages.join('\n').replace(/\u001b\[[0-9;]*m/g, '') || undefined,
      }))),
    });
  }
};
