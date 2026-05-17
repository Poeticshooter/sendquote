import { test, expect } from '@playwright/test'

test.describe('Public Quote Page', () => {
  test('shows 404 for invalid token', async ({ page }) => {
    await page.goto('/q/invalid-token-123')
    await expect(page.getByText(/not found|invalid|expired/i)).toBeVisible()
  })

  test('API returns 400 without token', async ({ request }) => {
    const res = await request.get('/api/public-quote')
    expect(res.status()).toBe(400)
    const json = await res.json()
    expect(json.error).toBe('missing token')
  })

  test('API returns 404 for invalid token', async ({ request }) => {
    const res = await request.get('/api/public-quote?token=nonexistent')
    expect(res.status()).toBe(404)
  })
})

test.describe('API Health', () => {
  test('cron endpoint returns 401 without auth', async ({ request }) => {
    const res = await request.get('/api/cron')
    expect(res.status()).toBe(401)
  })

  test('admin login returns 400 without body', async ({ request }) => {
    const res = await request.post('/api/admin/login', {
      data: {},
    })
    expect(res.status()).toBe(400)
  })
})
