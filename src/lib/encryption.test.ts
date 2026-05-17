import { describe, it, expect, beforeAll } from 'vitest'
import { encrypt, decrypt, generateEncryptionKey } from './encryption'

beforeAll(() => {
  process.env.ENCRYPTION_KEY = '0'.repeat(64)
})

describe('encryption', () => {
  it('encrypts and decrypts correctly', () => {
    const plaintext = 'my-secret-password'
    const encrypted = encrypt(plaintext)
    const decrypted = decrypt(encrypted)
    expect(decrypted).toBe(plaintext)
  })

  it('produces different ciphertext for same plaintext', () => {
    const plaintext = 'same-text'
    const enc1 = encrypt(plaintext)
    const enc2 = encrypt(plaintext)
    expect(enc1).not.toBe(enc2)
  })

  it('handles empty string', () => {
    expect(encrypt('')).toBe('')
    expect(decrypt('')).toBe('')
  })

  it('throws on invalid ciphertext format', () => {
    expect(() => decrypt('invalid-format')).toThrow('Invalid encrypted data format')
  })

  it('throws on tampered ciphertext', () => {
    const encrypted = encrypt('secret')
    const parts = encrypted.split(':')
    parts[3] = parts[3].slice(0, -1) + 'X'
    const tampered = parts.join(':')
    expect(() => decrypt(tampered)).toThrow()
  })

  it('handles unicode characters', () => {
    const plaintext = 'हिंदी password 🔐'
    const decrypted = decrypt(encrypt(plaintext))
    expect(decrypted).toBe(plaintext)
  })

  it('generates valid encryption keys', () => {
    const key = generateEncryptionKey()
    expect(key.length).toBe(64)
    expect(/^[0-9a-f]+$/.test(key)).toBe(true)
  })
})
