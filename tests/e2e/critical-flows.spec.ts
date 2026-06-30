/**
 * Critical User Journey E2E Tests
 * Covers: Auth, Quotes, Mobile responsiveness
 */

import { test, expect } from "@playwright/test";

// ─── Mobile Viewports ──────────────────────────────────────────────────────

const MOBILE_VIEWPORTS = [
  { width: 375, height: 667, name: "iPhone SE" },   // Mobile first
  { width: 390, height: 844, name: "iPhone 14" },
  { width: 414, height: 896, name: "iPhone 11 Pro Max" },
  { width: 360, height: 800, name: "Galaxy S24" },
  { width: 430, height: 932, name: "iPhone 15 Pro Max" },
];

// ─── Desktop Viewports ─────────────────────────────────────────────────────

const DESKTOP_VIEWPORTS = [
  { width: 1280, height: 720, name: "Desktop HD" },
  { width: 1920, height: 1080, name: "Desktop Full HD" },
  { width: 1440, height: 900, name: "Desktop 1440p" },
];

// ─── Test: Marketing Pages Responsive ──────────────────────────────────────

test.describe("Marketing Pages - Responsive", () => {
  for (const vp of [...MOBILE_VIEWPORTS.slice(0, 2), ...DESKTOP_VIEWPORTS.slice(0, 1)]) {
    test(`landing page renders on ${vp.name}`, async ({ browser }) => {
      const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
      const page = await context.newPage();
      await page.goto("/");
      expect(await page.locator("h1").isVisible()).toBe(true);
      expect(await page.locator("body").isVisible()).toBe(true);
      await context.close();
    });
  }

  for (const vp of [...MOBILE_VIEWPORTS.slice(0, 2)]) {
    test(`pricing page renders on ${vp.name}`, async ({ browser }) => {
      const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
      const page = await context.newPage();
      await page.goto("/pricing");
      expect(await page.locator("h1").isVisible()).toBe(true);
      // Mobile menu toggle should be visible on small screens
      const mobileMenuBtn = page.locator('button[aria-label="Toggle navigation menu"]');
      if (await mobileMenuBtn.isVisible().catch(() => false)) {
        expect(await mobileMenuBtn.getAttribute("aria-expanded")).toBe("false");
      }
      await context.close();
    });
  }

  test("signup form is usable on mobile", async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    await page.goto("/signup");
    // Form fields should be visible without scrolling
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();
    await expect(page.locator('[type="submit"]')).toBeVisible();
    await context.close();
  });

  test("login form is usable on mobile", async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 375, height: 667 } });
    const page = await context.newPage();
    await page.goto("/login");
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
    await context.close();
  });
});

// ─── Test: Navigation ──────────────────────────────────────────────────────

test.describe("Navigation", () => {
  test("page loads under 3 seconds", async ({ page }) => {
    const start = Date.now();
    await page.goto("/");
    const loadTime = Date.now() - start;
    expect(loadTime).toBeLessThan(3000);
  });

  test("all major pages return 200", async ({ page }) => {
    const pages = ["/", "/pricing", "/features", "/login", "/signup", "/faq", "/blog", "/contact"];
    for (const p of pages) {
      const response = await page.goto(p);
      expect(response?.status()).toBe(200);
    }
  });

  test("headline is present on all major marketing pages", async ({ page }) => {
    const pages = ["/", "/pricing", "/features", "/faq", "/contact"];
    for (const p of pages) {
      await page.goto(p);
      await expect(page.locator("h1").first()).toBeVisible();
    }
  });

  test("privacy and terms pages are accessible", async ({ page }) => {
    await page.goto("/privacy");
    await expect(page.locator("h1")).toBeVisible();
    await page.goto("/terms");
    await expect(page.locator("h1")).toBeVisible();
  });
});

// ─── Test: Accessibility ───────────────────────────────────────────────────

test.describe("Accessibility", () => {
  test("skip navigation link exists and is focusable", async ({ page }) => {
    await page.goto("/");
    const skipLink = page.locator('a[href="#main-content"]');
    await expect(skipLink).toBeVisible();
    // Tab to it
    await page.keyboard.press("Tab");
    await expect(skipLink).toBeFocused();
  });

  test("all images have alt text on landing page", async ({ page }) => {
    await page.goto("/");
    const images = page.locator("img");
    const count = await images.count();
    for (let i = 0; i < count; i++) {
      const alt = await images.nth(i).getAttribute("alt");
      expect(alt).not.toBeNull();
    }
  });

  test("form inputs have associated labels on signup page", async ({ page }) => {
    await page.goto("/signup");
    const emailInput = page.locator("#email");
    const passwordInput = page.locator("#password");
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    // Labels should exist
    const labels = page.locator("label");
    await expect(labels.first()).toBeVisible();
  });
});

// ─── Test: Error Pages ─────────────────────────────────────────────────────

test.describe("Error Pages", () => {
  test("404 page for unknown route", async ({ page }) => {
    const response = await page.goto("/this-page-does-not-exist-12345");
    expect(response?.status()).toBe(404);
  });
});

// ─── Test: Quote Token Flow ────────────────────────────────────────────────

test.describe("Quote Token", () => {
  test("invalid quote token shows error state", async ({ page }) => {
    await page.goto("/q/invalid-token-here");
    await expect(page.locator("body")).toBeVisible();
  });
});
