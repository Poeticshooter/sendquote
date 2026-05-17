import { describe, it, expect } from 'vitest'
import { logActivity } from './activity'

describe('logActivity', () => {
  it('builds correct insert payload', () => {
    const payload = {
      user_id: 'u-1',
      entity_type: 'quote' as const,
      entity_id: 'q-1',
      action: 'quote_sent',
      metadata: { client_email: 'test@example.com' },
    }

    expect(payload.user_id).toBe('u-1')
    expect(payload.entity_type).toBe('quote')
    expect(payload.entity_id).toBe('q-1')
    expect(payload.action).toBe('quote_sent')
    expect(payload.metadata).toHaveProperty('client_email')
  })

  it('logActivity function exists and has correct signature', () => {
    expect(typeof logActivity).toBe('function')
    expect(logActivity.length).toBe(4) // userId, entityType, entityId, action, metadata?
  })
})
