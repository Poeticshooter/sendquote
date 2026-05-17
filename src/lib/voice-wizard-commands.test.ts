import { describe, it, expect } from 'vitest'
import { parseWizardCommand, getWizardVoiceHint } from './voice-wizard-commands'

describe('parseWizardCommand', () => {
  describe('navigation commands', () => {
    it('should parse next step command', () => {
      expect(parseWizardCommand('next', 1, 0)).toEqual({ type: 'navigate', direction: 'next' })
      expect(parseWizardCommand('next step', 1, 0)).toEqual({ type: 'navigate', direction: 'next' })
      expect(parseWizardCommand('aage badho', 1, 0)).toEqual({ type: 'navigate', direction: 'next' })
    })

    it('should parse previous step command', () => {
      expect(parseWizardCommand('back', 2, 0)).toEqual({ type: 'navigate', direction: 'prev' })
      expect(parseWizardCommand('previous', 2, 0)).toEqual({ type: 'navigate', direction: 'prev' })
      expect(parseWizardCommand('peeche jao', 2, 0)).toEqual({ type: 'navigate', direction: 'prev' })
    })

    it('should parse step number command', () => {
      expect(parseWizardCommand('step 3', 1, 0)).toEqual({ type: 'navigate', direction: 3 })
      expect(parseWizardCommand('go to step 2', 1, 0)).toEqual({ type: 'navigate', direction: 2 })
    })
  })

  describe('save/send commands', () => {
    it('should parse save draft command', () => {
      expect(parseWizardCommand('save draft', 4, 0)).toEqual({ type: 'save_draft' })
      expect(parseWizardCommand('save as draft', 4, 0)).toEqual({ type: 'save_draft' })
    })

    it('should parse save and send command', () => {
      expect(parseWizardCommand('save and send', 4, 0)).toEqual({ type: 'save_and_send' })
      expect(parseWizardCommand('bhej do', 4, 0)).toEqual({ type: 'save_and_send' })
    })
  })

  describe('client commands (step 1)', () => {
    it('should parse client name', () => {
      const result = parseWizardCommand('Rahul Sharma', 1, 0)
      expect(result.type).toBe('set_client')
      if (result.type === 'set_client') {
        expect(result.name).toBe('Rahul Sharma')
      }
    })

    it('should parse email', () => {
      const result = parseWizardCommand('client@example.com', 1, 0)
      expect(result.type).toBe('set_email')
      if (result.type === 'set_email') {
        expect(result.email).toBe('client@example.com')
      }
    })
  })

  describe('item commands (step 2)', () => {
    it('should parse item with quantity and rate', () => {
      const result = parseWizardCommand('cement 50 bags at 350', 2, 0)
      expect(result.type).toBe('add_item')
      if (result.type === 'add_item') {
        expect(result.description).toBe('cement')
        expect(result.quantity).toBe(50)
        expect(result.rate).toBe(350)
      }
    })

    it('should parse simple item pattern', () => {
      const result = parseWizardCommand('steel rods 100 at 50', 2, 0)
      expect(result.type).toBe('add_item')
      if (result.type === 'add_item') {
        expect(result.quantity).toBe(100)
        expect(result.rate).toBe(50)
      }
    })
  })

  describe('pricing commands (step 3)', () => {
    it('should parse GST rate', () => {
      const result = parseWizardCommand('18 percent GST', 3, 0)
      expect(result.type).toBe('set_gst')
      if (result.type === 'set_gst') {
        expect(result.rate).toBe(18)
      }
    })

    it('should parse discount percentage', () => {
      const result = parseWizardCommand('10% discount', 3, 0)
      expect(result.type).toBe('set_discount')
      if (result.type === 'set_discount') {
        expect(result.value).toBe(10)
      }
    })
  })

  describe('cancel and help', () => {
    it('should parse cancel command', () => {
      expect(parseWizardCommand('cancel', 2, 0)).toEqual({ type: 'cancel' })
      expect(parseWizardCommand('band karo', 2, 0)).toEqual({ type: 'cancel' })
    })

    it('should parse help command', () => {
      expect(parseWizardCommand('help', 2, 0)).toEqual({ type: 'help' })
      expect(parseWizardCommand('madad', 2, 0)).toEqual({ type: 'help' })
    })
  })

  describe('unknown commands', () => {
    it('should return unknown for unrecognized input', () => {
      expect(parseWizardCommand('random gibberish', 2, 0)).toEqual({ type: 'unknown' })
    })
  })
})

describe('getWizardVoiceHint', () => {
  it('should return step 1 hint', () => {
    expect(getWizardVoiceHint(1)).toBe('Say client name, email, or "next"')
  })

  it('should return step 2 hint', () => {
    expect(getWizardVoiceHint(2)).toBe('Say "cement 50 bags at 350" or "next"')
  })

  it('should return step 3 hint', () => {
    expect(getWizardVoiceHint(3)).toBe('Say "18 percent GST" or "10% discount" or "next"')
  })

  it('should return step 4 hint', () => {
    expect(getWizardVoiceHint(4)).toBe('Say "save and send" or "save draft"')
  })

  it('should return default hint for unknown step', () => {
    expect(getWizardVoiceHint(0)).toBe('Speak or type your input')
    expect(getWizardVoiceHint(5)).toBe('Speak or type your input')
  })
})
