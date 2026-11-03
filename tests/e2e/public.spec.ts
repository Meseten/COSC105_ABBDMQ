import { expect, test } from "@playwright/test";

test("the planner front page loads with the coci mark", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByLabel("coci, back to the planner")).toBeVisible();
  await expect(page.locator("span", { hasText: "meals from your cocina" }).first()).toBeVisible();
});

test("the manifest serves as a real manifest", async ({ request }) => {
  const res = await request.get("/manifest.webmanifest");
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toContain("manifest");
});

test("the password eye flips the field type and keeps the value", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Password", { exact: true }).fill("secret123");
  await page.getByRole("button", { name: "Show password" }).click();
  const field = page.getByLabel("Password", { exact: true });
  await expect(field).toHaveAttribute("type", "text");
  await expect(field).toHaveValue("secret123");
  await page.getByRole("button", { name: "Hide password" }).click();
  await expect(field).toHaveAttribute("type", "password");
});

test("the back to top pill on terms returns to zero", async ({ page }) => {
  await page.goto("/terms");
  // the pill mounts only after the page has scrolled past the intro
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  const pill = page.getByLabel("Back to the top of this page");
  await expect(pill).toBeVisible();
  await pill.click();
  await expect
    .poll(() => page.evaluate(() => window.scrollY), { timeout: 5000 })
    .toBeLessThanOrEqual(4);
});

test("the stewards desk shows its gate signed out", async ({ page }) => {
  await page.goto("/moderation");
  await expect(page.getByText("Stewards only")).toBeVisible();
});

test("the bell stays hidden until signed in", async ({ page }) => {
  await page.goto("/community");
  await expect(page.locator('summary[aria-label="Notifications"]')).toHaveCount(0);
});
