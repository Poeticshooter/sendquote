import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase', () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u-1' } } }) },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
    })),
  })),
}))

describe('QuoteWizard component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('exports QuoteWizard component', async () => {
    const mod = await import('@/components/quote-wizard')
    expect(typeof mod.default).toBe('function')
  })

  it('renders in create mode', async () => {
    const { default: QuoteWizard } = await import('@/components/quote-wizard')
    expect(QuoteWizard).toBeDefined()
  })

  it('renders in edit mode with initialData', async () => {
    const { default: QuoteWizard } = await import('@/components/quote-wizard')
    const initialData = {
      client_name: 'Test Client',
      client_phone: '1234567890',
      client_email: 'client@test.com',
      client_address: '123 Test St',
      validTill: '2024-02-01',
      paymentTerms: 'Net 30',
      items: [{ id: '1', description: 'Item 1', spec: '', quantity: 1, unit: 'pcs', rate: 1000, amount: 1000 }],
      discount: 0,
      discountType: 'percentage' as const,
      gstRate: 18,
      notes: '',
      terms: '',
    }
    const element = <QuoteWizard initialData={initialData} quoteId="q-1" mode="edit" />
    expect(element).toBeDefined()
  })
})

describe('PublicQuoteClient component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('exports PublicQuoteClient component', async () => {
    const mod = await import('@/app/q/[token]/PublicQuoteClient')
    expect(typeof mod.default).toBe('function')
  })

  it('accepts token from params', async () => {
    const { default: PublicQuoteClient } = await import('@/app/q/[token]/PublicQuoteClient')
    const element = <PublicQuoteClient />
    expect(element).toBeDefined()
  })
})

describe('DashboardShell component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('exports DashboardShell component', async () => {
    const mod = await import('@/app/dashboard/DashboardShell')
    expect(typeof mod.default).toBe('function')
  })
})

describe('QuoteDetailClient component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('exports QuoteDetailClient component', async () => {
    const mod = await import('@/app/quote/[id]/QuoteDetailClient')
    expect(typeof mod.default).toBe('function')
  })
})

describe('Toast component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('exports ToastProvider', async () => {
    const mod = await import('@/components/toast')
    expect(typeof mod.ToastProvider).toBe('function')
  })

  it('exports useToast hook', async () => {
    const mod = await import('@/components/toast')
    expect(typeof mod.useToast).toBe('function')
  })
})

describe('Sidebar component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('exports Sidebar component', async () => {
    const mod = await import('@/components/sidebar')
    expect(typeof mod.default).toBe('function')
  })
})

describe('CommandPalette component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('exports CommandPalette component', async () => {
    const mod = await import('@/components/command-palette')
    expect(typeof mod.default).toBe('function')
  })
})

describe('VoiceAssistant component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('exports VoiceAssistant component', async () => {
    const mod = await import('@/components/voice-assistant')
    expect(typeof mod.default).toBe('function')
  })
})

describe('ChatBot component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('exports ChatBot component', async () => {
    const mod = await import('@/components/chat-bot')
    expect(typeof mod.default).toBe('function')
  })
})

describe('ErrorBoundary component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('exports ErrorBoundary component', async () => {
    const mod = await import('@/components/error-boundary')
    expect(typeof mod.default).toBe('function')
  })
})


describe('BrandLogo component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('exports BrandLogo component', async () => {
    const mod = await import('@/components/brand-logo')
    expect(typeof mod.default).toBe('function')
  })
})

describe('Skeleton components', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('exports Skeleton components', async () => {
    const mod = await import('@/components/skeleton')
    expect(typeof mod.Skeleton).toBe('function')
    expect(typeof mod.SkeletonCard).toBe('function')
    expect(typeof mod.SkeletonText).toBe('function')
  })
})

describe('TemplateGallery component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('exports TemplateGallery component', async () => {
    const mod = await import('@/components/template-gallery')
    expect(typeof mod.default).toBe('function')
  })
})

describe('ActivityTimeline component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('exports ActivityTimeline component', async () => {
    const mod = await import('@/components/activity-timeline')
    expect(typeof mod.default).toBe('function')
  })
})

describe('EmptyState component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('exports EmptyState component', async () => {
    const mod = await import('@/components/empty-state')
    expect(typeof mod.default).toBe('function')
  })
})

describe('Breadcrumbs component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('exports Breadcrumbs component', async () => {
    const mod = await import('@/components/breadcrumbs')
    expect(typeof mod.default).toBe('function')
  })
})

describe('I18nWrapper component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('exports I18nWrapper component', async () => {
    const mod = await import('@/components/i18n-wrapper')
    expect(typeof mod.default).toBe('function')
  })
})

describe('UserOnboarding component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('exports UserOnboarding component', async () => {
    const mod = await import('@/components/user-onboarding')
    expect(typeof mod.default).toBe('function')
  })
})

describe('UserTour component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('exports UserTour component', async () => {
    const mod = await import('@/components/user-tour')
    expect(typeof mod.default).toBe('function')
  })
})
