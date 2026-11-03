import { expect, test } from "@playwright/test";
import { openFirstBoard } from "./helpers";

/*
 * Signed-out tour of one live board post. The seeded post must exist, the
 * runner inserts and clears it with SQL around the suite.
 */

test("a board card renders title and cook", async ({ page }) => {
  await page.goto("/community");
  await expect(page.getByRole("link", { name: "Open the plan" })).toBeVisible();
  await expect(page.getByRole("heading", { name: /One palengke week/ })).toBeVisible();
});

test("the plan detail shows the day plan and budget", async ({ page }) => {
  await page.goto("/community");
  await openFirstBoard(page);
  await expect(page.getByText(/Your .*day plan/)).toBeVisible();
  await expect(page.getByText(/1,430/).first()).toBeVisible();
});

test("liking signed out asks for sign in", async ({ page }) => {
  await page.goto("/community");
  await openFirstBoard(page);
  await page.getByRole("button", { name: /^Like/ }).click();
  await expect(page.getByText("Sign in to like recipes.").first()).toBeVisible();
});

test("the save to try button hides signed out", async ({ page }) => {
  await page.goto("/community");
  await openFirstBoard(page);
  await expect(page.getByRole("button", { name: "On the shelf" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Save to try" })).toHaveCount(0);
});

test("the chika box waits for sign in", async ({ page }) => {
  await page.goto("/community");
  await openFirstBoard(page);
  await expect(page.getByRole("heading", { name: /Chika/ })).toBeVisible();
  await expect(page.getByText("to join the chika.")).toBeVisible();
});
