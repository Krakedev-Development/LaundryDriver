const { defineConfig } = require("@playwright/test");
module.exports = defineConfig({
  testDir: "./tests",
  testMatch: "**/*.spec.cjs",
  timeout: 120000,
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:8098",
    channel: process.env.PLAYWRIGHT_CHANNEL || "msedge",
    viewport: { width: 412, height: 915 },
    headless: true,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "node scripts/preview-export.cjs",
    url: "http://127.0.0.1:8098",
    reuseExistingServer: false,
    timeout: 30000,
  },
});
