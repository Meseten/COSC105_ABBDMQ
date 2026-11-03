import type { Page } from "@playwright/test";

/** Opens the first board card and guarantees the detail route. In dev mode
 * the very first click can land during hydration, so fall back to the href. */
export async function openFirstBoard(page: Page): Promise<void> {
  const link = page.getByRole("link", { name: "Open the plan" }).first();
  await link.waitFor();
  const href = await link.getAttribute("href");
  await link.click();
  try {
    await page.waitForURL(/\/community\/[0-9a-f-]{36}/, { timeout: 8000 });
  } catch {
    await page.goto(href!, { waitUntil: "domcontentloaded" });
  }
  await expectOkDetail(page);
}

async function expectOkDetail(page: Page): Promise<void> {
  const url = page.url();
  if (!/\/community\/[0-9a-f-]{36}/.test(url)) {
    throw new Error(`expected a board detail route, got ${url}`);
  }
}
