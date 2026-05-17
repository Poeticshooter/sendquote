import { extractItemDetails, extractPercentage, parseIndianNumber } from './voice-utils'

export type WizardCommand =
  | { type: 'add_item'; description: string; quantity: number; rate: number; unit?: string }
  | { type: 'set_client'; name: string }
  | { type: 'set_email'; email: string }
  | { type: 'set_phone'; phone: string }
  | { type: 'set_address'; address: string }
  | { type: 'set_gst'; rate: number }
  | { type: 'set_discount'; value: number; discountType: 'percent' | 'flat' }
  | { type: 'set_valid_until'; days: number }
  | { type: 'set_notes'; notes: string }
  | { type: 'set_terms'; terms: string }
  | { type: 'navigate'; direction: 'next' | 'prev' | 'step' | number }
  | { type: 'save_draft' }
  | { type: 'save_and_send' }
  | { type: 'cancel' }
  | { type: 'remove_item'; index: number }
  | { type: 'undo' }
  | { type: 'help' }
  | { type: 'unknown' }

export function parseWizardCommand(text: string, currentStep: number, itemCount: number): WizardCommand {
  const lower = text.toLowerCase().trim()

  // Navigation commands
  if (lower === 'next' || lower === 'next step' || lower === 'aage badho' || lower === 'aage' || lower === 'next page') {
    return { type: 'navigate', direction: 'next' }
  }
  if (lower === 'back' || lower === 'previous' || lower === 'peeche jao' || lower === 'peeche' || lower === 'go back') {
    return { type: 'navigate', direction: 'prev' }
  }
  if (lower.match(/step\s*(\d)/)) {
    const match = lower.match(/step\s*(\d)/)
    if (match) {
      const step = parseInt(match[1], 10)
      if (step >= 1 && step <= 4) {
        return { type: 'navigate', direction: step }
      }
    }
  }
  if (lower.includes('go to step') || lower.includes('jump to step')) {
    const match = lower.match(/(\d)/)
    if (match) {
      const step = parseInt(match[1], 10)
      if (step >= 1 && step <= 4) {
        return { type: 'navigate', direction: step }
      }
    }
  }

  // Save/send commands
  if (lower === 'save draft' || lower === 'save as draft' || lower === 'draft save karo' || lower === 'save karo') {
    return { type: 'save_draft' }
  }
  if (lower === 'save and send' || lower === 'save and email' || lower === 'bhej do' || lower === 'send it') {
    return { type: 'save_and_send' }
  }

  // Cancel
  if (lower === 'cancel' || lower === 'stop' || lower === 'band karo' || lower === 'chhod do') {
    return { type: 'cancel' }
  }

  // Undo
  if (lower === 'undo' || lower === 'wapas jao' || lower === 'undo karo') {
    return { type: 'undo' }
  }

  // Help
  if (lower === 'help' || lower === 'madad' || lower === 'kya kar sakta hoon') {
    return { type: 'help' }
  }

  // Remove item
  const removeMatch = lower.match(/remove\s*(?:item\s*)?(\d+)/)
  if (removeMatch) {
    const idx = parseInt(removeMatch[1], 10) - 1
    if (idx >= 0 && idx < itemCount) {
      return { type: 'remove_item', index: idx }
    }
  }

  // Client name (step 1)
  if (currentStep === 1) {
    const namePatterns = [
      /^(?:for|client|customer|to|bill to)\s+(.+)$/i,
      /^(?:client name|customer name|name)\s*(?:is\s*)?(.+)$/i,
      /^(.+)$/i,
    ]
    for (const pattern of namePatterns) {
      const match = text.match(pattern)
      if (match && match[1] && match[1].trim().length > 1) {
        const name = match[1].trim()
        if (!name.includes('@') && !name.match(/^\d+$/)) {
          return { type: 'set_client', name }
        }
      }
    }
  }

  // Email (step 1)
  const emailMatch = text.match(/[\w.+-]+@[\w-]+\.[\w.]+/)
  if (emailMatch && currentStep === 1) {
    return { type: 'set_email', email: emailMatch[0] }
  }

  // Phone (step 1)
  const phoneMatch = text.match(/(\d{10,12})/)
  if (phoneMatch && currentStep === 1 && (lower.includes('phone') || lower.includes('mobile') || lower.includes('number'))) {
    return { type: 'set_phone', phone: phoneMatch[1] }
  }

  // Address (step 1)
  if (currentStep === 1 && (lower.startsWith('address') || lower.startsWith('client address') || lower.startsWith('location'))) {
    const address = text.replace(/^(?:client\s+)?(?:address|location)\s*(?:is\s*)?/i, '').trim()
    if (address.length > 3) {
      return { type: 'set_address', address }
    }
  }

  // Valid until (step 1)
  const validMatch = lower.match(/valid\s*(?:for|until|till)?\s*(\d+)\s*(?:days?)/)
  if (validMatch && currentStep === 1) {
    return { type: 'set_valid_until', days: parseInt(validMatch[1], 10) }
  }

  // Item addition (step 2) - multi-field parsing
  if (currentStep === 2) {
    const item = extractItemDetails(text)
    if (item) {
      const unitMatch = lower.match(/\b(bags|pieces|sqft|nos|units|kg|meter|hours?|days?|pcs|set|box|liters?)\b/i)
      return {
        type: 'add_item',
        description: item.description,
        quantity: item.quantity,
        rate: item.rate,
        unit: unitMatch ? unitMatch[1].toLowerCase() : undefined,
      }
    }

    // Try simpler patterns
    const simpleItemMatch = text.match(/(.+?)\s+(\d+)\s*(?:at|for|₹|rs)\s*(\d+(?:\.\d+)?)/i)
    if (simpleItemMatch) {
      return {
        type: 'add_item',
        description: simpleItemMatch[1].trim(),
        quantity: parseInt(simpleItemMatch[2], 10),
        rate: parseFloat(simpleItemMatch[3]),
      }
    }
  }

  // GST (step 3)
  if (currentStep === 3) {
    const gstRate = extractPercentage(text)
    if (gstRate !== null && (lower.includes('gst') || lower.includes('tax'))) {
      return { type: 'set_gst', rate: gstRate }
    }

    const discount = extractPercentage(text)
    if (discount !== null && (lower.includes('discount') || lower.includes('off'))) {
      const isFlat = lower.includes('flat') || lower.includes('rupees') || lower.includes('rs')
      return {
        type: 'set_discount',
        value: discount,
        discountType: isFlat ? 'flat' : 'percent',
      }
    }

    // Indian number parsing for amounts
    const amount = parseIndianNumber(text)
    if (amount !== null && (lower.includes('discount') || lower.includes('off'))) {
      return {
        type: 'set_discount',
        value: amount,
        discountType: 'flat',
      }
    }
  }

  // Notes/terms (step 4)
  if (currentStep === 4) {
    if (lower.startsWith('note') || lower.startsWith('notes') || lower.startsWith('add note')) {
      const notes = text.replace(/^(?:add\s+)?notes?\s*(?:is\s*)?:?\s*/i, '').trim()
      if (notes.length > 2) {
        return { type: 'set_notes', notes }
      }
    }
    if (lower.startsWith('term') || lower.startsWith('terms') || lower.startsWith('add term')) {
      const terms = text.replace(/^(?:add\s+)?terms?\s*(?:is\s*)?:?\s*/i, '').trim()
      if (terms.length > 2) {
        return { type: 'set_terms', terms }
      }
    }
  }

  return { type: 'unknown' }
}

export function getWizardVoiceHint(step: number): string {
  switch (step) {
    case 1:
      return 'Say client name, email, or "next"'
    case 2:
      return 'Say "cement 50 bags at 350" or "next"'
    case 3:
      return 'Say "18 percent GST" or "10% discount" or "next"'
    case 4:
      return 'Say "save and send" or "save draft"'
    default:
      return 'Speak or type your input'
  }
}
