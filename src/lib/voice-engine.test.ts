import { describe, it, expect } from 'vitest'
import { findBestIntent, processIntent, createInitialContext } from './voice-engine'

describe('findBestIntent', () => {
  it('detects create quote intent', () => {
    const { intent, confidence } = findBestIntent('create a new quote', 'en-IN')
    expect(intent).toBe('CREATE_QUOTE')
    expect(confidence).toBeGreaterThan(0.5)
  })

  it('detects list quotes intent', () => {
    const { intent, confidence } = findBestIntent('show my quotes', 'en-IN')
    expect(intent).toBe('LIST_QUOTES')
    expect(confidence).toBeGreaterThan(0.5)
  })

  it('detects help intent with help keyword', () => {
    const { intent, confidence } = findBestIntent('help me', 'en-IN')
    expect(intent).toBe('HELP')
    expect(confidence).toBeGreaterThan(0.5)
  })

  it('detects send quote intent', () => {
    const { intent, confidence } = findBestIntent('send quote', 'en-IN')
    expect(intent).toBe('SEND_QUOTE')
    expect(confidence).toBeGreaterThan(0.5)
  })

  it('detects save draft intent', () => {
    const { intent, confidence } = findBestIntent('save draft', 'en-IN')
    expect(intent).toBe('SAVE_DRAFT')
    expect(confidence).toBeGreaterThan(0.5)
  })

  it('returns low confidence for unrelated text', () => {
    const { confidence } = findBestIntent('the weather is nice today', 'en-IN')
    expect(confidence).toBeLessThan(0.5)
  })
})

describe('processIntent', () => {
  it('starts quote creation from IDLE', () => {
    const ctx = createInitialContext()
    const result = processIntent('CREATE_QUOTE', ctx, 'create a quote', 'en-IN')
    expect(result.newContext.state).toBe('ASKING_CLIENT')
    expect(result.response).toContain('new quote')
  })

  it('extracts client name if provided', () => {
    const ctx = createInitialContext()
    const result = processIntent('CREATE_QUOTE', ctx, 'create quote for Acme Corp', 'en-IN')
    expect(result.newContext.state).toBe('ASKING_EMAIL')
    expect(result.newContext.pendingClientName).toBe('Acme Corp')
  })

  it('handles cancel from any state', () => {
    const ctx = { ...createInitialContext(), state: 'ASKING_ITEMS' as const }
    const result = processIntent('CANCEL', ctx, 'stop', 'en-IN')
    expect(result.newContext.state).toBe('IDLE')
    expect(result.response.toLowerCase()).toContain('cancel')
  })

  it('adds items during ASKING_ITEMS state', () => {
    const ctx = { ...createInitialContext(), state: 'ASKING_ITEMS' as const }
    const result = processIntent('ADD_ITEM', ctx, 'cement 50 bags at 350', 'en-IN')
    expect(result.newContext.pendingItems.length).toBe(1)
    expect(result.newContext.pendingItems[0].quantity).toBe(50)
    expect(result.newContext.pendingItems[0].rate).toBe(350)
  })

  it('transitions to review when done adding items', () => {
    const ctx = { ...createInitialContext(), state: 'ASKING_ITEMS' as const }
    const result = processIntent('SAVE_DRAFT', ctx, 'done', 'en-IN')
    expect(result.newContext.state).toBe('REVIEWING_QUOTE')
  })

  it('confirms send with yes', () => {
    const ctx = { ...createInitialContext(), state: 'CONFIRMING_SEND' as const }
    const result = processIntent('CONFIRM_YES', ctx, 'yes', 'en-IN')
    expect(result.newContext.state).toBe('IDLE')
    expect(result.action).toBe('send_quote')
  })

  it('cancels send with no', () => {
    const ctx = { ...createInitialContext(), state: 'CONFIRMING_SEND' as const }
    const result = processIntent('CONFIRM_NO', ctx, 'no', 'en-IN')
    expect(result.newContext.state).toBe('REVIEWING_QUOTE')
  })

  it('handles listing quotes from IDLE', () => {
    const ctx = createInitialContext()
    const result = processIntent('LIST_QUOTES', ctx, 'show quotes', 'en-IN')
    expect(result.newContext.state).toBe('LISTING_QUOTES')
    expect(result.action).toBe('fetch_quotes')
  })

  it('handles convert invoice with quote number', () => {
    const ctx = createInitialContext()
    const result = processIntent('CONVERT_INVOICE', ctx, 'convert quote QT-001 to invoice', 'en-IN')
    expect(result.action).toBe('convert_invoice:QT-001')
  })
})
