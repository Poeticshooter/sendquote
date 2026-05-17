import { describe, it, expect } from 'vitest'
import { messagesToStored, storedToMessages } from './voice-session'

describe('voice-session message conversion', () => {
  it('should convert messages to stored format', () => {
    const messages = [
      { role: 'user' as const, text: 'Hello', confidence: 0.9 },
      { role: 'assistant' as const, text: 'Hi there!' },
    ]
    const stored = messagesToStored(messages)
    expect(stored).toHaveLength(2)
    expect(stored[0].role).toBe('user')
    expect(stored[0].text).toBe('Hello')
    expect(stored[0].confidence).toBe(0.9)
    expect(stored[0].timestamp).toBeDefined()
  })

  it('should convert stored messages back to message format', () => {
    const stored = [
      { role: 'user' as const, text: 'Hello', confidence: 0.9, timestamp: '2024-01-01T00:00:00Z' },
      { role: 'assistant' as const, text: 'Hi there!' },
    ]
    const messages = storedToMessages(stored)
    expect(messages).toHaveLength(2)
    expect(messages[0].role).toBe('user')
    expect(messages[0].text).toBe('Hello')
    expect(messages[0].confidence).toBe(0.9)
  })

  it('should handle empty arrays', () => {
    expect(messagesToStored([])).toEqual([])
    expect(storedToMessages([])).toEqual([])
  })
})
