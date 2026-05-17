import { describe, it, expect } from 'vitest'

describe('auth module exports', () => {
  it('exports getUser function', async () => {
    const mod = await import('./auth')
    expect(typeof mod.getUser).toBe('function')
  })
})
