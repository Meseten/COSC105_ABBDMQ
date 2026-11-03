import { defineConfig } from "@playwright/test";

/**
 * Runs against the local dev server, which must be up on 37999 for a
 * reuseExistingServer pick. Every cooked API call (plan generation, Chef Pan)
 * stays out of the specs, so the suite never touches the paid key.
 */
const PORT = 37999;
const baseURL = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  workers: 1,
  fullyParallel: false,
  retries: 0,
  use: {
    baseURL,
    headless: true,
    locale: "en-PH",
  },
  webServer: {
    command: `npx next dev -p ${PORT}`,
    port: PORT,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
