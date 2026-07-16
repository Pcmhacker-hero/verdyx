import { test, expect } from "@playwright/test";

/**
 * Visual regression: the BrandMark on the home page must not drift.
 *
 * If this test fails after an intentional redesign, regenerate the
 * baseline with:
 *
 *   bun run test:visual -- --update-snapshots
 *
 * Otherwise, treat a diff as an unintended visual change to the brand
 * identity and fix the component (src/routes/index.tsx — BrandMark).
 */
test.describe("BrandMark visual regression", () => {
  test("home page BrandMark matches baseline", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });

    const mark = page.getByTestId("brand-mark").first();
    await mark.waitFor({ state: "visible" });

    // Wait for web fonts so the "V" glyph is stable across runs.
    await page.evaluate(() => document.fonts.ready);

    await expect(mark).toHaveScreenshot("brandmark-home.png");
  });
});
