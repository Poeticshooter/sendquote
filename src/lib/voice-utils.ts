export function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = []

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i]
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }

  return matrix[b.length][a.length]
}

export function extractClientName(text: string): string | null {
  const patterns = [
    /(?:for|client|customer|to)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*(?:ke liye|ke liye|ke name|ka naam|ke naam)/i,
    /(?:ग्राहक|क्लाइंट)\s+([^\s,]+)/i,
    /(?:client|customer)\s+name\s+(?:is\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match && match[1]) {
      return match[1].trim()
    }
  }

  return null
}

export function extractItemDetails(text: string): { description: string; quantity: number; rate: number } | null {
  const patterns = [
    {
      regex: /(.+?)\s+(\d+)\s*(?:bags|pieces|sqft|nos|units|kg|meter|hour|day|pcs|set|box|liters?|months?|years?|calls?|quarters?)?.*(?:at|for|rate|per|₹|rs|rupees)\s*(\d+(?:\.\d+)?)/i,
      descGroup: 1,
      qtyGroup: 2,
      rateGroup: 3,
    },
    {
      regex: /(\d+)\s*(?:bags|pieces|sqft|nos|units|kg|meter|hour|day|pcs|set|box|liters?|months?|years?|calls?|quarters?)\s+(?:of\s+)?(.+?)\s*(?:at|for|rate|per|₹|rs|rupees)\s*(\d+(?:\.\d+)?)/i,
      descGroup: 2,
      qtyGroup: 1,
      rateGroup: 3,
    },
    {
      regex: /(.+?)\s+(\d+(?:\.\d+)?)\s*(?:at|for|rate|per|₹|rs|rupees)\s*(\d+(?:\.\d+)?)/i,
      descGroup: 1,
      qtyGroup: 2,
      rateGroup: 3,
    },
  ]

  for (const { regex, descGroup, qtyGroup, rateGroup } of patterns) {
    const match = text.match(regex)
    if (match) {
      const description = match[descGroup].trim().replace(/\s+/g, ' ')
      const quantity = parseInt(match[qtyGroup], 10)
      const rate = parseFloat(match[rateGroup])

      if (description && !isNaN(quantity) && !isNaN(rate)) {
        return { description, quantity, rate }
      }
    }
  }

  return null
}

export function extractPercentage(text: string): number | null {
  const patterns = [
    /(\d+(?:\.\d+)?)\s*(?:%|percent|prct)/i,
    /(?:gst|tax|discount)\s*(\d+(?:\.\d+)?)/i,
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      const value = parseFloat(match[1])
      if (!isNaN(value) && value >= 0 && value <= 100) {
        return value
      }
    }
  }

  return null
}

export function extractQuoteNumber(text: string): string | null {
  const patterns = [
    /([A-Z]{1,4}[-_]?\d{2,6})/i,
    /quote\s*(?:number|#)?\s*([A-Z]{1,4}[-_]?\d{2,6})/i,
    /(?:QT|QS|Q|INV|QT-|QS-|Q-)\s*(\d+)/i,
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      return match[1].trim()
    }
  }

  const numberWords: Record<string, string> = {
    'one': '1', 'two': '2', 'three': '3', 'four': '4', 'five': '5',
    'six': '6', 'seven': '7', 'eight': '8', 'nine': '9', 'ten': '10',
    'first': '1', 'second': '2', 'third': '3', 'fourth': '4', 'fifth': '5',
  }

  const lower = text.toLowerCase()
  for (const [word, num] of Object.entries(numberWords)) {
    if (lower.includes(`quote ${word}`) || lower.includes(`${word} quote`)) {
      return num
    }
  }

  return null
}

export function parseIndianNumber(text: string): number | null {
  const lower = text.toLowerCase()

  const wordToNum: Record<string, number> = {
    'zero': 0, 'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
    'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
    'eleven': 11, 'twelve': 12, 'thirteen': 13, 'fourteen': 14, 'fifteen': 15,
    'sixteen': 16, 'seventeen': 17, 'eighteen': 18, 'nineteen': 19, 'twenty': 20,
    'thirty': 30, 'forty': 40, 'fifty': 50, 'sixty': 60, 'seventy': 70, 'eighty': 80, 'ninety': 90,
    'hundred': 100, 'thousand': 1000, 'lakh': 100000, 'lakhs': 100000,
    'crore': 10000000, 'crores': 10000000,
    'dozen': 12, 'score': 20,
  }

  let normalized = lower
  for (const [word, num] of Object.entries(wordToNum)) {
    normalized = normalized.replace(new RegExp(`\\b${word}\\b`, 'g'), ` ${num} `)
  }

  normalized = normalized.replace(/[₹,rs\.?\s*rupees?]/gi, '').trim()

  const numberMatch = normalized.match(/(\d+(?:\.\d+)?)\s*(k|lakh|lakhs|crore|crores|thousand|million|billion)?/i)
  if (numberMatch) {
    let base = parseFloat(numberMatch[1])
    const suffix = numberMatch[2]?.toLowerCase()

    if (suffix === 'k' || suffix === 'thousand') {
      base *= 1000
    } else if (suffix === 'lakh' || suffix === 'lakhs') {
      base *= 100000
    } else if (suffix === 'crore' || suffix === 'crores') {
      base *= 10000000
    } else if (suffix === 'million') {
      base *= 1000000
    } else if (suffix === 'billion') {
      base *= 1000000000
    }

    return base
  }

  const plainMatch = normalized.match(/(\d+(?:,\d+)*(?:\.\d+)?)/)
  if (plainMatch) {
    return parseFloat(plainMatch[1].replace(/,/g, ''))
  }

  return null
}

export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s\u0900-\u097F\u0B80-\u0BFF\u0C00-\u0C7F\u0A00-\u0A7F\u0A80-\u0AFF\u0980-\u09FF\u0C80-\u0CFF\u0D00-\u0D7F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}
