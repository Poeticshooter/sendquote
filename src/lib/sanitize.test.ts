import { describe, it, expect } from 'vitest'
import { sanitizeInput, sanitizeHtml, sanitizeObject } from './sanitize'

describe('sanitizeInput', () => {
  it('removes script tags', () => {
    expect(sanitizeInput('<script>alert(1)</script>')).toBe('')
  })

  it('removes all HTML tags (text-only mode)', () => {
    expect(sanitizeInput('<img src=x onerror="alert(1)">')).toBe('')
  })

  it('removes javascript: protocol in HTML context', () => {
    expect(sanitizeInput('<a href="javascript:alert(1)">click</a>')).toBe('click')
  })

  it('removes iframe tags', () => {
    expect(sanitizeInput('<iframe src="evil.com"></iframe>')).toBe('')
  })

  it('preserves safe text', () => {
    expect(sanitizeInput('Hello World')).toBe('Hello World')
  })

  it('trims whitespace', () => {
    expect(sanitizeInput('  hello  ')).toBe('hello')
  })

  it('handles empty string', () => {
    expect(sanitizeInput('')).toBe('')
  })

  it('escapes nested dangerous tags', () => {
    const result = sanitizeInput('<div><script>alert(1)</script></div>')
    expect(result).not.toContain('<script>')
  })
})

describe('sanitizeHtml', () => {
  it('allows safe HTML tags', () => {
    const result = sanitizeHtml('<p>Hello <strong>World</strong></p>')
    expect(result).toContain('<p>')
    expect(result).toContain('<strong>')
  })

  it('removes script tags', () => {
    const result = sanitizeHtml('<p>Hello</p><script>alert(1)</script>')
    expect(result).not.toContain('<script>')
    expect(result).toContain('<p>')
  })

  it('removes iframe tags', () => {
    const result = sanitizeHtml('<p>Safe</p><iframe src="evil.com"></iframe>')
    expect(result).not.toContain('iframe')
  })

  it('allows safe links', () => {
    const result = sanitizeHtml('<a href="https://example.com">Link</a>')
    expect(result).toContain('href="https://example.com"')
  })

  it('blocks javascript: URLs', () => {
    const result = sanitizeHtml('<a href="javascript:alert(1)">Click</a>')
    expect(result).not.toContain('javascript:')
  })

  it('allows images with safe src', () => {
    const result = sanitizeHtml('<img src="https://example.com/img.png" alt="test">')
    expect(result).toContain('<img')
    expect(result).toContain('src="https://example.com/img.png"')
  })

  it('handles empty string', () => {
    expect(sanitizeHtml('')).toBe('')
  })
})

describe('sanitizeObject', () => {
  it('sanitizes string values', () => {
    const obj = { name: '<script>evil</script>', count: 42 }
    const result = sanitizeObject(obj)
    expect(result.name).toBe('')
    expect(result.count).toBe(42)
  })

  it('preserves non-string values', () => {
    const obj = { num: 42, bool: true, arr: [1, 2] }
    const result = sanitizeObject(obj)
    expect(result.num).toBe(42)
    expect(result.bool).toBe(true)
    expect(result.arr).toEqual([1, 2])
  })
})
