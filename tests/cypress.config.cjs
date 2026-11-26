const { defineConfig } = require('cypress');

module.exports = defineConfig({
  video: false,
  allowCypressEnv: false,
  screenshotOnRunFailure: true,
  screenshotsFolder: 'reports/cypress/screenshots',
  videosFolder: 'reports/cypress/videos',
  viewportWidth: 1280,
  viewportHeight: 900,
  retries: 0,
  e2e: {
    baseUrl: 'http://127.0.0.1:4175',
    specPattern: 'frontend/e2e/**/*.cy.js',
    supportFile: 'frontend/e2e/support.js',
    fixturesFolder: 'frontend/fixtures',
  },
});
