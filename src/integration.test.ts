import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('Integration: API route exports', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('send-quote-email route exports POST', async () => {
    const mod = await import('@/app/api/send-quote-email/route')
    expect(typeof mod.POST).toBe('function')
  })

  it('public-quote route exports GET', async () => {
    const mod = await import('@/app/api/public-quote/route')
    expect(typeof mod.GET).toBe('function')
  })

  it('public-quote-action route exports POST', async () => {
    const mod = await import('@/app/api/public-quote-action/route')
    expect(typeof mod.POST).toBe('function')
  })

  it('track route exports GET', async () => {
    const mod = await import('@/app/api/track/route')
    expect(typeof mod.GET).toBe('function')
  })

  it('health route exports GET', async () => {
    const mod = await import('@/app/api/health/route')
    expect(typeof mod.GET).toBe('function')
  })

  it('cron route exports GET', async () => {
    process.env.CRON_SECRET = 'test'
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key'
    const mod = await import('@/app/api/cron/route')
    expect(typeof mod.GET).toBe('function')
  })

  it('webhook route exports POST', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key'
    process.env.RAZORPAY_WEBHOOK_SECRET = 'test-secret'
    const mod = await import('@/app/api/webhook/route')
    expect(typeof mod.POST).toBe('function')
  })

  it('admin/login route exports POST', async () => {
    const mod = await import('@/app/api/admin/login/route')
    expect(typeof mod.POST).toBe('function')
  })

  it('convert-to-invoice route exports POST', async () => {
    const mod = await import('@/app/api/convert-to-invoice/route')
    expect(typeof mod.POST).toBe('function')
  })

  it('duplicate-quote route exports POST', async () => {
    const mod = await import('@/app/api/duplicate-quote/route')
    expect(typeof mod.POST).toBe('function')
  })

  it('export-all route exports GET', async () => {
    const mod = await import('@/app/api/export-all/route')
    expect(typeof mod.GET).toBe('function')
  })

  it('create-razorpay-order route exports POST and PUT', async () => {
    const mod = await import('@/app/api/create-razorpay-order/route')
    expect(typeof mod.POST).toBe('function')
    expect(typeof mod.PUT).toBe('function')
  })

  it('webhooks route exports GET, POST, DELETE', async () => {
    const mod = await import('@/app/api/webhooks/route')
    expect(typeof mod.GET).toBe('function')
    expect(typeof mod.POST).toBe('function')
    expect(typeof mod.DELETE).toBe('function')
  })

  it('upload-logo route exports POST', async () => {
    const mod = await import('@/app/api/upload-logo/route')
    expect(typeof mod.POST).toBe('function')
  })
})

describe('Integration: Lib module exports', () => {
  it('email module exports all functions', async () => {
    const mod = await import('@/lib/email')
    expect(typeof mod.sendEmail).toBe('function')
    expect(typeof mod.notifyQuoteOpened).toBe('function')
    expect(typeof mod.notifyQuoteAccepted).toBe('function')
    expect(typeof mod.notifyChangesRequested).toBe('function')
    expect(typeof mod.remindFollowUp).toBe('function')
    expect(typeof mod.remindAfterOpen).toBe('function')
    expect(typeof mod.remindExpiry).toBe('function')
  })

  it('pdf module exports both generators', async () => {
    const mod = await import('@/lib/pdf')
    expect(typeof mod.generateQuotePDF).toBe('function')
    expect(typeof mod.generateInvoicePDF).toBe('function')
  })

  it('rate-limit module exports functions', async () => {
    const mod = await import('@/lib/rate-limit')
    expect(typeof mod.rateLimit).toBe('function')
    expect(typeof mod.clearRateLimitStore).toBe('function')
  })

  it('encryption module exports functions', async () => {
    const mod = await import('@/lib/encryption')
    expect(typeof mod.encrypt).toBe('function')
    expect(typeof mod.decrypt).toBe('function')
    expect(typeof mod.generateEncryptionKey).toBe('function')
  })

  it('sanitize module exports functions', async () => {
    const mod = await import('@/lib/sanitize')
    expect(typeof mod.sanitizeInput).toBe('function')
    expect(typeof mod.sanitizeObject).toBe('function')
  })

  it('plan module exports functions', async () => {
    const mod = await import('@/lib/plan')
    expect(typeof mod.checkQuota).toBe('function')
    expect(typeof mod.incrementQuoteCount).toBe('function')
  })

  it('activity module exports functions', async () => {
    const mod = await import('@/lib/activity')
    expect(typeof mod.logActivity).toBe('function')
  })

  it('auth module exports functions', async () => {
    const mod = await import('@/lib/auth')
    expect(typeof mod.getUser).toBe('function')
  })
})

describe('Integration: Component exports', () => {
  it('QuoteWizard is a valid component', async () => {
    const mod = await import('@/components/quote-wizard')
    expect(typeof mod.default).toBe('function')
  })

  it('Sidebar is a valid component', async () => {
    const mod = await import('@/components/sidebar')
    expect(typeof mod.default).toBe('function')
  })

  it('CommandPalette is a valid component', async () => {
    const mod = await import('@/components/command-palette')
    expect(typeof mod.default).toBe('function')
  })

  it('VoiceAssistant is a valid component', async () => {
    const mod = await import('@/components/voice-assistant')
    expect(typeof mod.default).toBe('function')
  })

  it('ChatBot is a valid component', async () => {
    const mod = await import('@/components/chat-bot')
    expect(typeof mod.default).toBe('function')
  })

  it('ToastProvider is a valid component', async () => {
    const mod = await import('@/components/toast')
    expect(typeof mod.ToastProvider).toBe('function')
  })

  it('ErrorBoundary is a valid component', async () => {
    const mod = await import('@/components/error-boundary')
    expect(typeof mod.default).toBe('function')
  })

  it('TemplateGallery is a valid component', async () => {
    const mod = await import('@/components/template-gallery')
    expect(typeof mod.default).toBe('function')
  })
})
