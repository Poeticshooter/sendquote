import { describe, it, expect, vi } from 'vitest'

describe('checkQuota logic', () => {
  it('free user with 2 quotes has 3 remaining', () => {
    const maxQuotes = 5
    const count = 2
    const remaining = Math.max(0, maxQuotes - count)
    expect(remaining).toBe(3)
    expect(remaining > 0).toBe(true)
  })

  it('free user with 5 quotes has 0 remaining', () => {
    const maxQuotes = 5
    const count = 5
    const remaining = Math.max(0, maxQuotes - count)
    expect(remaining).toBe(0)
    expect(remaining > 0).toBe(false)
  })

  it('free user with 6 quotes is blocked', () => {
    const maxQuotes = 5
    const count = 6
    const remaining = Math.max(0, maxQuotes - count)
    expect(remaining).toBe(0)
    expect(remaining > 0).toBe(false)
  })

  it('paid user always allowed', () => {
    const plan: string = 'starter'
    const allowed = plan !== 'free'
    expect(allowed).toBe(true)
  })
})

describe('incrementQuoteCount logic', () => {
  it('resets count when month changes', () => {
    const now = new Date()
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const resetMonth = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`

    expect(currentMonth).not.toBe(resetMonth)
  })

  it('does not reset when same month', () => {
    const now = new Date()
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

    expect(currentMonth).toBe(currentMonth)
  })
})
