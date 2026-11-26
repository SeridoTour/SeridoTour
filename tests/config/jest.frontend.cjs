const path = require('node:path');

module.exports = {
  rootDir: path.resolve(__dirname, '../..'),
  testEnvironment: 'jsdom',
  testEnvironmentOptions: { customExportConditions: ['node', 'node-addons'] },
  testMatch: ['<rootDir>/tests/frontend/unit/**/*.spec.ts'],
  moduleFileExtensions: ['ts', 'js', 'json', 'vue'],
  transform: {
    '^.+\\.vue$': require.resolve('@vue/vue3-jest'),
    '^.+\\.ts$': [require.resolve('ts-jest'), {
      tsconfig: path.join(__dirname, 'tsconfig.frontend.json'),
      diagnostics: { ignoreCodes: [1343] },
      babelConfig: path.join(__dirname, 'babel.frontend.cjs'),
    }],
  },
  globals: {
    'vue-jest': { tsConfig: path.join(__dirname, 'tsconfig.frontend.json'), babelConfig: path.join(__dirname, 'babel.frontend.cjs') },
  },
  setupFilesAfterEnv: ['<rootDir>/tests/frontend/unit/setup.ts'],
  clearMocks: true,
  collectCoverageFrom: [
    'apps/frontend/src/stores/*.ts',
    'apps/frontend/src/utils/format.ts',
    'apps/frontend/src/services/{places,itineraries}.ts',
    'apps/frontend/src/components/{RatingStars,ConfirmDialog,PlaceCard}.vue',
  ],
  coverageDirectory: '<rootDir>/tests/reports/frontend/coverage',
  coverageReporters: ['text', 'html', 'json-summary'],
  reporters: ['default', [path.join(__dirname, '../scripts/jest-report.cjs'), { suite: 'frontend' }]],
};
