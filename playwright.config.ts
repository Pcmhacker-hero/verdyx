import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config for visual regression tests.
 *
 * Run:   bun run test:visual
 * Update baselines after an intentional change:
 *        bun run test:visual -- --update-snapshots
 */
export default defineConfig({
  testDir: "./tests/visual",
  fullyParallel: false,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:8080",
    viewport: { width: 1280, height: 800 },
    colorScheme: "dark",
  },
  expect: {
    // Allow a tiny amount of AA/font-rendering drift; catches real style changes.
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.01,
      threshold: 0.15,
      animations: "disabled",
      caret: "hide",
    },
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // Prefer a system Chromium when present (e.g. Nix sandboxes, CI images
        // without Playwright's bundled headless-shell system libs). Falls back
        // to Playwright's bundled Chromium on normal dev machines.
        launchOptions: process.env.CHROMIUM_PATH
          ? { executablePath: process.env.CHROMIUM_PATH }
          : undefined,
      },
    },
  ],
  webServer: {
    command: "bun run dev",
    url: "http://localhost:8080",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
