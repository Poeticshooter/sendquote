import { test, expect } from '@playwright/test'

test.describe('Landing Page', () => {
  test('loads and has correct title', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/SendQuote/)
  })

  test('displays hero section with CTA', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('Send quotes that')).toBeVisible()
    await expect(page.getByText('close deals')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Start Free' })).toBeVisible()
  })

  test('navigation links work', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: 'Sign In' }).click()
    await expect(page).toHaveURL(/.*login/)
  })

  test('displays features section', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('Professional PDF')).toBeVisible()
    await expect(page.getByText('Open Tracking')).toBeVisible()
    await expect(page.getByText('GST Ready')).toBeVisible()
  })

  test('displays pricing section', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('Start free. Upgrade when you mean business.')).toBeVisible()
    await expect(page.getByText('Free')).toBeVisible()
    await expect(page.getByText('Starter')).toBeVisible()
    await expect(page.getByText('Professional')).toBeVisible()
  })

  test('displays FAQ section', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('Common questions')).toBeVisible()
    await expect(page.getByText('Does my client need to create an account')).toBeVisible()
  })
})
