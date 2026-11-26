const path = require('node:path');

module.exports = {
  rootDir: path.resolve(__dirname, '../..'),
  testEnvironment: 'node',
  testMatch: ['<rootDir>/tests/backend/**/*.spec.ts'],
  transform: {
    '^.+\\.ts$': [require.resolve('ts-jest'), {
      tsconfig: path.join(__dirname, 'tsconfig.backend.json'),
    }],
  },
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/apps/backend/src/$1',
    '^@prisma/client$': require.resolve('@prisma/client', { paths: [path.resolve(__dirname, '../../apps/backend')] }),
  },
  setupFiles: ['reflect-metadata'],
  clearMocks: true,
  collectCoverageFrom: [
    'apps/backend/src/auth/{auth.service,roles.guard}.ts',
    'apps/backend/src/token/token.service.ts',
    'apps/backend/src/modules/{users,places,reviews,itineraries}/*.service.ts',
    'apps/backend/src/weather/weather.service.ts',
    'apps/backend/src/common/utils/sanitize-log.util.ts',
    'apps/backend/src/common/upload/{image-signature.util,image-validation.pipe}.ts',
  ],
  coverageDirectory: '<rootDir>/tests/reports/backend/coverage',
  coverageReporters: ['text', 'html', 'json-summary'],
  reporters: ['default', [path.join(__dirname, '../scripts/jest-report.cjs'), { suite: 'backend' }]],
};
