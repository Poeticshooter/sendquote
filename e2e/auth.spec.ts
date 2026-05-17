import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('login page loads', async ({ page }) => {
    await page.goto('/login')
    await expect(page).toHaveTitle(/Login|SendQuote/)
    await expect(page.getByRole('heading', { name: /sign in|login/i })).toBeVisible()
  })

  test('register page loads', async ({ page }) => {
    await page.goto('/register')
    await expect(page).toHaveTitle(/Register|Create Account|SendQuote/)
  })

  test('redirects to login when accessing dashboard unauthenticated', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/.*login/)
  })

  test('redirects to login when accessing settings unauthenticated', async ({ page }) => {
    await page.goto('/settings')
    await expect(page).toHaveURL(/.*login/)
  })

  test('forgot password page loads', async ({ page }) => {
    await page.goto('/forgot-password')
    await expect(page).toHaveTitle(/Forgot|Reset|SendQuote/)
  })
})
