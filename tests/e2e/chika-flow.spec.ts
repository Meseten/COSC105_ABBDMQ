import { expect, test, type Browser, type Page } from "@playwright/test";
import { openFirstBoard } from "./helpers";

/*
 * Two real cooks meet on one board post: A chikas, B answers, A edits and
 * deletes, B flags, both hit the stewards gate. Fresh accounts every run.
 * The suite never opens the planner or Chef Pan, so nothing spends the
 * owner's model credits.
 */

const STAMP = Date.now().toString(36);
const COOK_A = `e2e-alib-${STAMP}`;
const COOK_B = `e2e-bayb-${STAMP}`;

async function createCook(browser: Browser, name: string): Promise<Page> {
  const page = await browser.newPage();
  await page.goto("/login");
  await page.getByRole("tab", { name: "Create account" }).click();
  await page.getByLabel("Display name").fill(name);
  await page.getByLabel("Email").fill(`${name}@e2e.coci.test`);
  await page.getByLabel("Password", { exact: true }).fill("plums-in-the-basket");
  await page.locator('form button[type="submit"]').click();
  // the session lands in local storage on success, or stays empty when the
  // project requires an email confirmation, which this suite cannot do
  await expect
    .poll(() => page.evaluate(() => Object.keys(localStorage).some((k) => k.endsWith("auth-token"))), {
      timeout: 15_000,
      message: "session never appeared after signup",
    })
    .toBe(true);
  return page;
}

test("two cooks chika, answer, edit, flag", async ({ browser }) => {
  test.setTimeout(150_000);
  const a = await createCook(browser, COOK_A);
  const b = await createCook(browser, COOK_B);

  // A finds the board and leaves a chika
  await a.goto("/community");
  await openFirstBoard(a);
  await a.getByLabel("Write a reply").fill("Trying this Saturday, bagoong ready.");
  await a.getByRole("button", { name: "Chika", exact: true }).click();
  // match the posted paragraph, not the compose box that holds the same words
  await expect(a.locator("p", { hasText: "Trying this Saturday, bagoong ready." }).first()).toBeVisible({ timeout: 10_000 });

  // B answers A directly
  await b.goto("/community");
  await openFirstBoard(b);
  await expect(b.locator("p", { hasText: "Trying this Saturday, bagoong ready." }).first()).toBeVisible({ timeout: 15_000 });
  await b.getByRole("button", { name: /Answer this chika/ }).first().click();
  await b.getByLabel("Write a reply").fill("Kalabasa is in season, cheap win.");
  await b.getByRole("button", { name: "Answer", exact: true }).click();
  await expect(b.locator("p", { hasText: "Kalabasa is in season, cheap win." }).first()).toBeVisible({ timeout: 10_000 });

  // A's bell rings for B's answer (the inbox fetches when the bell opens)
  await a.locator('summary[aria-label="Notifications"]').click();
  await expect(a.getByText(/left a chika on your board/).first()).toBeVisible({ timeout: 15_000 });

  // A edits the own chika inside the quarter hour window
  await a.getByRole("button", { name: "Edit this chika", exact: true }).first().click();
  await a.getByLabel("Edit the chika text").fill("Trying this Saturday, palengke run first.");
  await a.getByRole("button", { name: "Keep" }).click();
  await expect(a.locator("p", { hasText: "Trying this Saturday, palengke run first." }).first()).toBeVisible({ timeout: 10_000 });

  // B flags the chika
  await b.getByRole("button", { name: /Report this comment/ }).first().click();
  await b.getByLabel("Report reason").fill("Dup of the same board story posted twice.");
  await b.getByRole("button", { name: "Send report" }).click();
  await expect(b.getByText("Sent. The stewards will take a look.")).toBeVisible();

  // A as a regular member cannot open the desk
  await a.goto("/moderation");
  await expect(a.getByText("Stewards only")).toBeVisible();

  // cleanup, A takes the chika back so the board stays tidy
  await a.goto("/community");
  await openFirstBoard(a);
  await a.getByRole("button", { name: "Delete this chika" }).first().click();
  await expect(a.getByText(/No chika yet|Chika \(0\)/)).toBeVisible({ timeout: 10_000 });
});
