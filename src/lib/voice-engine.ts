import { VoiceIntent, LOCALE_INTENTS } from './voice-locales'
import { levenshteinDistance, normalizeText, extractClientName, extractItemDetails, extractPercentage, extractQuoteNumber, parseIndianNumber } from './voice-utils'

export type VoiceState =
  | 'IDLE'
  | 'CREATING_QUOTE'
  | 'ASKING_CLIENT'
  | 'ASKING_EMAIL'
  | 'ASKING_ITEMS'
  | 'ASKING_GST'
  | 'ASKING_DISCOUNT'
  | 'REVIEWING_QUOTE'
  | 'CONFIRMING_SEND'
  | 'LISTING_QUOTES'
  | 'ASKING_QUOTE_NUMBER'

export interface PendingItem {
  description: string
  quantity: number
  rate: number
}

export interface VoiceContext {
  state: VoiceState
  draftQuoteId: string | null
  draftQuoteNumber: string | null
  pendingClientName: string | null
  pendingClientEmail: string | null
  pendingItem: PendingItem | null
  pendingItems: PendingItem[]
  lastIntent: VoiceIntent | null
  history: string[]
  confidence: number
}

export function createInitialContext(): VoiceContext {
  return {
    state: 'IDLE',
    draftQuoteId: null,
    draftQuoteNumber: null,
    pendingClientName: null,
    pendingClientEmail: null,
    pendingItem: null,
    pendingItems: [],
    lastIntent: null,
    history: [],
    confidence: 0,
  }
}

export function findBestIntent(input: string, locale: string): { intent: VoiceIntent; confidence: number } {
  const normalized = normalizeText(input)
  const keywords = LOCALE_INTENTS[locale] || LOCALE_INTENTS['en-IN']

  let bestIntent: VoiceIntent = 'UNKNOWN'
  let bestScore = 0

  for (const [intent, phrases] of Object.entries(keywords)) {
    if (intent === 'UNKNOWN') continue

    for (const phrase of phrases) {
      const normPhrase = normalizeText(phrase)

      if (normalized.includes(normPhrase)) {
        return { intent: intent as VoiceIntent, confidence: 1.0 }
      }

      const distance = levenshteinDistance(normalized, normPhrase)
      const maxLen = Math.max(normalized.length, normPhrase.length)
      const score = maxLen > 0 ? 1 - distance / maxLen : 0

      if (score > bestScore) {
        bestScore = score
        bestIntent = intent as VoiceIntent
      }
    }
  }

  return { intent: bestIntent, confidence: bestScore }
}

interface ProcessResult {
  newContext: VoiceContext
  response: string
  action?: string
}

export function processIntent(
  intent: VoiceIntent,
  context: VoiceContext,
  text: string,
  locale: string = 'en-IN'
): ProcessResult {
  const updatedHistory = [...context.history.slice(-4), text]

  switch (context.state) {
    case 'IDLE':
      return processIdle(intent, text, updatedHistory, locale)

    case 'CREATING_QUOTE':
    case 'ASKING_CLIENT':
      return processCreatingQuote(intent, text, context, updatedHistory, locale)

    case 'ASKING_EMAIL':
      return processAskingEmail(intent, text, context, updatedHistory, locale)

    case 'ASKING_ITEMS':
      return processAskingItems(intent, text, context, updatedHistory, locale)

    case 'ASKING_GST':
      return processAskingGst(intent, text, context, updatedHistory, locale)

    case 'ASKING_DISCOUNT':
      return processAskingDiscount(intent, text, context, updatedHistory, locale)

    case 'REVIEWING_QUOTE':
      return processReviewing(intent, text, context, updatedHistory, locale)

    case 'CONFIRMING_SEND':
      return processConfirmingSend(intent, text, context, updatedHistory, locale)

    case 'LISTING_QUOTES':
      return processListingQuotes(intent, text, updatedHistory, locale)

    case 'ASKING_QUOTE_NUMBER':
      return processAskingQuoteNumber(intent, text, context, updatedHistory, locale)

    default:
      return {
        newContext: { ...context, history: updatedHistory, state: 'IDLE' },
        response: "I'm not sure what to do. Say 'help' for commands.",
      }
  }
}

function processIdle(intent: VoiceIntent, text: string, history: string[], locale: string): ProcessResult {
  switch (intent) {
    case 'CREATE_QUOTE': {
      const clientName = extractClientName(text)
      if (clientName) {
        return {
          newContext: {
            state: 'ASKING_EMAIL',
            draftQuoteId: null,
            draftQuoteNumber: null,
            pendingClientName: clientName,
            pendingClientEmail: null,
            pendingItem: null,
            pendingItems: [],
            lastIntent: 'CREATE_QUOTE',
            history,
            confidence: 1,
          },
          response: `Starting a new quote for ${clientName}. What's the client's email? Say 'skip' if not available.`,
        }
      }
      return {
        newContext: {
          state: 'ASKING_CLIENT',
          draftQuoteId: null,
          draftQuoteNumber: null,
          pendingClientName: null,
          pendingClientEmail: null,
          pendingItem: null,
          pendingItems: [],
          lastIntent: 'CREATE_QUOTE',
          history,
          confidence: 1,
        },
        response: "Starting a new quote. Who is this quote for?",
      }
    }

    case 'LIST_QUOTES':
      return {
        newContext: { state: 'LISTING_QUOTES', draftQuoteId: null, draftQuoteNumber: null, pendingClientName: null, pendingClientEmail: null, pendingItem: null, pendingItems: [], lastIntent: 'LIST_QUOTES', history, confidence: 1 },
        action: 'fetch_quotes',
        response: "Fetching your recent quotes...",
      }

    case 'HELP':
      return {
        newContext: { ...createInitialContext(), history },
        response: "I can help you: create a quote, show recent quotes, convert a quote to invoice, or check status. What would you like to do?",
      }

    case 'CANCEL':
      return {
        newContext: createInitialContext(),
        response: "Cancelled. What else can I help with?",
      }

    case 'SHOW_STATUS':
      return {
        newContext: { ...createInitialContext(), history },
        action: 'show_status',
        response: "Checking your quote status...",
      }

    case 'CONVERT_INVOICE': {
      const quoteNum = extractQuoteNumber(text)
      if (quoteNum) {
        return {
          newContext: { ...createInitialContext(), history },
          action: `convert_invoice:${quoteNum}`,
          response: `Converting quote ${quoteNum} to invoice...`,
        }
      }
      return {
        newContext: { state: 'ASKING_QUOTE_NUMBER', draftQuoteId: null, draftQuoteNumber: null, pendingClientName: null, pendingClientEmail: null, pendingItem: null, pendingItems: [], lastIntent: 'CONVERT_INVOICE', history, confidence: 1 },
        response: "Which quote number would you like to convert to invoice?",
      }
    }

    default:
      return {
        newContext: { ...createInitialContext(), history },
        response: "I didn't quite catch that. Try saying 'create a quote' or 'show my quotes'.",
      }
  }
}

function processCreatingQuote(intent: VoiceIntent, text: string, context: VoiceContext, history: string[], _locale: string): ProcessResult {
  if (context.state === 'ASKING_CLIENT') {
    const clientName = extractClientName(text) || text.trim()
    if (clientName) {
      return {
        newContext: {
          ...context,
          state: 'ASKING_EMAIL',
          pendingClientName: clientName,
          history,
        },
        response: `Got it, quote for ${clientName}. What's the client's email address? Say 'skip' if not available.`,
      }
    }
  }

  if (context.state === 'ASKING_ITEMS') {
    return processAskingItems(intent, text, context, history, _locale)
  }

  switch (intent) {
    case 'SET_CLIENT': {
      const clientName = extractClientName(text) || text.trim()
      return {
        newContext: { ...context, state: 'ASKING_EMAIL', pendingClientName: clientName, history },
        response: `Client set to ${clientName}. What's their email?`,
      }
    }

    case 'ADD_ITEM': {
      const item = extractItemDetails(text)
      if (item) {
        const newItems = [...context.pendingItems, item]
        return {
          newContext: { ...context, pendingItems: newItems, history },
          response: `Added ${item.description}: ${item.quantity} at ₹${item.rate}. Add more items or say 'done' to continue.`,
        }
      }
      return {
        newContext: { ...context, history },
        response: "Please say the item name, quantity, and rate. For example: 'cement 50 bags at 350'.",
      }
    }

    case 'SAVE_DRAFT':
      return {
        newContext: { ...context, state: 'REVIEWING_QUOTE', history },
        action: 'save_draft',
        response: "Saving as draft...",
      }

    case 'SEND_QUOTE':
      return {
        newContext: { ...context, state: 'REVIEWING_QUOTE', history },
        action: 'save_and_send',
        response: "Let me review the quote before sending.",
      }

    case 'CANCEL':
      return {
        newContext: createInitialContext(),
        response: "Quote creation cancelled.",
      }

    default:
      return {
        newContext: { ...context, history },
        response: "You can add items, set the client name, or say 'done' when ready.",
      }
  }
}

function processAskingEmail(intent: VoiceIntent, text: string, context: VoiceContext, history: string[], _locale: string): ProcessResult {
  if (intent === 'SKIP_EMAIL' || text.toLowerCase().includes('skip') || text.toLowerCase().includes('no email') || text.toLowerCase().includes('nahi')) {
    return {
      newContext: { ...context, state: 'ASKING_ITEMS', pendingClientEmail: null, history },
      response: `No problem. What items would you like to add to the quote for ${context.pendingClientName || 'the client'}?`,
    }
  }

  const emailMatch = text.match(/[\w.+-]+@[\w-]+\.[\w.]+/)
  if (emailMatch) {
    return {
      newContext: { ...context, state: 'ASKING_ITEMS', pendingClientEmail: emailMatch[0], history },
      response: `Email saved: ${emailMatch[0]}. What items would you like to add?`,
    }
  }

  if (intent === 'SET_EMAIL') {
    const cleaned = text.replace(/email|address|id|daalo|mail/gi, '').trim()
    if (cleaned.includes('@')) {
      const match = cleaned.match(/[\w.+-]+@[\w-]+\.[\w.]+/)
      if (match) {
        return {
          newContext: { ...context, state: 'ASKING_ITEMS', pendingClientEmail: match[0], history },
          response: `Email saved: ${match[0]}. What items would you like to add?`,
        }
      }
    }
  }

  const simpleEmail = text.trim().toLowerCase()
  if (simpleEmail.includes('@') && simpleEmail.includes('.')) {
    return {
      newContext: { ...context, state: 'ASKING_ITEMS', pendingClientEmail: text.trim(), history },
      response: `Email saved: ${text.trim()}. What items would you like to add?`,
    }
  }

  return {
    newContext: { ...context, history },
    response: "Please say the email address, like 'raj at gmail dot com', or say 'skip'.",
  }
}

function processAskingItems(intent: VoiceIntent, text: string, context: VoiceContext, history: string[], _locale: string): ProcessResult {
  if (intent === 'CANCEL') {
    return { newContext: createInitialContext(), response: "Quote creation cancelled." }
  }

  if (intent === 'SAVE_DRAFT' || text.toLowerCase().includes('done') || text.toLowerCase().includes('finish')) {
    return {
      newContext: { ...context, state: 'REVIEWING_QUOTE', history },
      action: 'save_draft',
      response: "Saving your quote as draft...",
    }
  }

  if (intent === 'SEND_QUOTE') {
    return {
      newContext: { ...context, state: 'REVIEWING_QUOTE', history },
      action: 'save_and_send',
      response: "Let me review the quote before sending.",
    }
  }

  const item = extractItemDetails(text)
  if (item) {
    const newItems = [...context.pendingItems, item]
    return {
      newContext: { ...context, pendingItems: newItems, history },
      response: `Added ${item.description}: ${item.quantity} at ₹${item.rate}. Add more or say 'done'.`,
    }
  }

  return {
    newContext: { ...context, history },
    response: "I couldn't understand the item. Say something like 'cement 50 bags at 350'.",
  }
}

function processAskingGst(intent: VoiceIntent, text: string, context: VoiceContext, history: string[], _locale: string): ProcessResult {
  if (intent === 'CANCEL') {
    return { newContext: createInitialContext(), response: "Quote creation cancelled." }
  }

  const gstRate = extractPercentage(text)
  if (gstRate !== null) {
    return {
      newContext: { ...context, state: 'ASKING_DISCOUNT', history },
      action: `set_gst:${gstRate}`,
      response: `GST set to ${gstRate}%. Any discount?`,
    }
  }

  if (intent === 'SET_DISCOUNT' || text.toLowerCase().includes('no') || text.toLowerCase().includes('none')) {
    return {
      newContext: { ...context, state: 'ASKING_DISCOUNT', history },
      response: "No GST applied. Any discount?",
    }
  }

  return {
    newContext: { ...context, history },
    response: "Please say the GST rate, like '18 percent' or 'no GST'.",
  }
}

function processAskingDiscount(intent: VoiceIntent, text: string, context: VoiceContext, history: string[], _locale: string): ProcessResult {
  if (intent === 'CANCEL') {
    return { newContext: createInitialContext(), response: "Quote creation cancelled." }
  }

  const discount = extractPercentage(text)
  if (discount !== null) {
    return {
      newContext: { ...context, state: 'REVIEWING_QUOTE', history },
      action: `set_discount:${discount}`,
      response: `Discount set to ${discount}%. Let me review the quote.`,
    }
  }

  if (text.toLowerCase().includes('no') || text.toLowerCase().includes('none')) {
    return {
      newContext: { ...context, state: 'REVIEWING_QUOTE', history },
      response: "No discount. Let me review the quote.",
    }
  }

  return {
    newContext: { ...context, state: 'REVIEWING_QUOTE', history },
    response: "Moving to review.",
  }
}

function processReviewing(intent: VoiceIntent, text: string, context: VoiceContext, history: string[], _locale: string): ProcessResult {
  if (intent === 'CANCEL') {
    return { newContext: createInitialContext(), response: "Quote creation cancelled." }
  }

  if (intent === 'SEND_QUOTE' || text.toLowerCase().includes('send') || text.toLowerCase().includes('bhejo')) {
    return {
      newContext: { ...context, state: 'CONFIRMING_SEND', history },
      action: 'confirm_send',
      response: `Send this quote${context.pendingClientName ? ` to ${context.pendingClientName}` : ''}? Say 'yes' to confirm.`,
    }
  }

  if (intent === 'SAVE_DRAFT' || text.toLowerCase().includes('save') || text.toLowerCase().includes('draft')) {
    return {
      newContext: { ...createInitialContext(), history },
      action: 'save_draft',
      response: "Quote saved as draft!",
    }
  }

  if (intent === 'ADD_ITEM') {
    const item = extractItemDetails(text)
    if (item) {
      const newItems = [...context.pendingItems, item]
      return {
        newContext: { ...context, pendingItems: newItems, history },
        response: `Added ${item.description}. Say 'send' or 'save' when ready.`,
      }
    }
  }

  return {
    newContext: { ...context, history },
    response: "Say 'send' to send the quote, 'save' to save as draft, or 'add item' to add more.",
  }
}

function processConfirmingSend(intent: VoiceIntent, text: string, context: VoiceContext, history: string[], _locale: string): ProcessResult {
  if (intent === 'CONFIRM_YES') {
    return {
      newContext: createInitialContext(),
      action: 'send_quote',
      response: "Quote sent successfully!",
    }
  }

  if (intent === 'CONFIRM_NO' || intent === 'CANCEL') {
    return {
      newContext: { ...context, state: 'REVIEWING_QUOTE', history },
      response: "Not sent. You can edit or save as draft.",
    }
  }

  return {
    newContext: { ...context, history },
    response: "Please say 'yes' to send or 'no' to cancel.",
  }
}

function processListingQuotes(intent: VoiceIntent, text: string, history: string[], _locale: string): ProcessResult {
  if (intent === 'CANCEL') {
    return { newContext: createInitialContext(), response: "Cancelled." }
  }

  return {
    newContext: { ...createInitialContext(), history },
    action: 'fetch_quotes',
    response: "Here are your recent quotes...",
  }
}

function processAskingQuoteNumber(intent: VoiceIntent, text: string, context: VoiceContext, history: string[], _locale: string): ProcessResult {
  if (intent === 'CANCEL') {
    return { newContext: createInitialContext(), response: "Cancelled." }
  }

  const quoteNum = extractQuoteNumber(text)
  if (quoteNum) {
    return {
      newContext: createInitialContext(),
      action: `convert_invoice:${quoteNum}`,
      response: `Converting quote ${quoteNum} to invoice...`,
    }
  }

  return {
    newContext: { ...context, history },
    response: "I couldn't find the quote number. Say something like 'QT-001'.",
  }
}
