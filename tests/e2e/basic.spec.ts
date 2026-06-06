import { test, expect } from "@playwright/test";

test("landing page loads and shows headline", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("h1")).toContainText("Close Deals");
});

test("can navigate to pricing page", async ({ page }) => {
  await page.goto("/");
  await page.click('a:has-text("See Pricing")');
  await expect(page).toHaveURL("/pricing");
  await expect(page.locator("h1")).toContainText("Pricing");
});

test("pricing page shows tier cards", async ({ page }) => {
  await page.goto("/pricing");
  await expect(page.locator("text=Starter")).toBeVisible();
  await expect(page.locator("text=Growth")).toBeVisible();
  await expect(page.locator("text=Pro")).toBeVisible();
});

test("FAQ page has questions and answers", async ({ page }) => {
  await page.goto("/faq");
  await expect(page.locator("h1")).toContainText("FAQ");
  const questions = page.locator("h3");
  await expect(questions.first()).toBeVisible();
});

test("signup page has form fields", async ({ page }) => {
  await page.goto("/signup");
  await expect(page.locator('input[type="email"]')).toBeVisible();
  await expect(page.locator('input[type="password"]')).toBeVisible();
});
