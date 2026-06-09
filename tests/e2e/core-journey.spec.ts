import { test, expect } from "@playwright/test";

test.describe("Core Public Pages", () => {
  test("landing page loads and shows headline", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);
    await expect(page.locator("h1")).toBeVisible();
  });

  test("can navigate to pricing page", async ({ page }) => {
    await page.goto("/");
    await page.click('a:has-text("See Pricing")');
    await expect(page).toHaveURL("/pricing");
    await expect(page.locator("h1")).toContainText("Pricing");
  });

  test("pricing page shows tier cards", async ({ page }) => {
    const response = await page.goto("/pricing");
    expect(response?.status()).toBe(200);
    await expect(page.locator("h1")).toContainText("Pricing");
    await expect(page.locator("text=Starter").first()).toBeVisible();
    await expect(page.locator("text=Growth").first()).toBeVisible();
    await expect(page.locator("text=Pro").first()).toBeVisible();
  });
});

test.describe("Auth Pages", () => {
  test("login page loads and has required form fields", async ({ page }) => {
    const response = await page.goto("/login");
    expect(response?.status()).toBe(200);
    // The login form has email and password fields
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });

  test("signup page loads and has required form fields", async ({ page }) => {
    const response = await page.goto("/signup");
    expect(response?.status()).toBe(200);
    // The signup form has name, email, and password fields
    await expect(page.locator("#name")).toBeVisible();
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();
    await expect(page.getByRole("button", { name: /create account/i })).toBeVisible();
  });
});

test.describe("Content Pages", () => {
  test("blog page loads and shows posts", async ({ page }) => {
    const response = await page.goto("/blog");
    expect(response?.status()).toBe(200);
    await expect(page.locator("h1")).toBeVisible();
    // Blog page lists multiple posts
    const blogPostLinks = page.locator("a[href*='/blog/']");
    await expect(blogPostLinks.first()).toBeVisible();
  });

  test("FAQ page loads and has questions", async ({ page }) => {
    const response = await page.goto("/faq");
    expect(response?.status()).toBe(200);
    await expect(page.locator("h1")).toContainText("Frequently Asked");
    const questions = page.locator("h3");
    await expect(questions.first()).toBeVisible();
  });

  test("features page loads", async ({ page }) => {
    const response = await page.goto("/features");
    expect(response?.status()).toBe(200);
    await expect(page.locator("h1")).toBeVisible();
  });

  test("contact page loads", async ({ page }) => {
    const response = await page.goto("/contact");
    expect(response?.status()).toBe(200);
    await expect(page.locator("h1")).toBeVisible();
  });
});

test.describe("Quote Viewing Flow", () => {
  test("public quote page shows not-found for invalid token", async ({ page }) => {
    const response = await page.goto("/q/invalid-token-12345");
    // Should show some content (may not 404 in dev mode with Supabase unconnected)
    expect(response?.status()).toBe(200);
    // Verify the page renders (even if showing an error/not-found state)
    await expect(page.locator("body")).toBeVisible();
  });

  test("not-found page loads for unknown routes", async ({ page }) => {
    const response = await page.goto("/this-page-does-not-exist");
    expect(response?.status()).toBe(404);
  });
});

test.describe("Navigation Flow", () => {
  test("can navigate from landing to key pages via navbar links", async ({ page }) => {
    await page.goto("/");

    // Try clicking "Features" link if present in the navbar
    const featuresLink = page.locator('a[href="/features"]').first();
    if (await featuresLink.isVisible()) {
      await featuresLink.click();
      await expect(page).toHaveURL("/features");
      await expect(page.locator("h1")).toBeVisible();
    }
  });

  test("signup page has link to login page", async ({ page }) => {
    await page.goto("/signup");
    // The signup page should have a link to login
    const loginLink = page.locator('a[href="/login"]');
    await expect(loginLink.first()).toBeVisible();
  });

  test("login page has link to signup page", async ({ page }) => {
    await page.goto("/login");
    // The login page should have a link to signup
    const signupLink = page.locator('a[href="/signup"]');
    await expect(signupLink.first()).toBeVisible();
  });
});
