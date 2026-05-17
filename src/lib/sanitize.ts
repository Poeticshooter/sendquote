import sanitizeHtmlLib from 'sanitize-html'

const DEFAULT_ALLOWED_TAGS: string[] = []
const DEFAULT_ALLOWED_ATTR: string[] = []

export function sanitizeInput(input: string): string {
  if (!input) return ''
  return sanitizeHtmlLib(input, {
    allowedTags: DEFAULT_ALLOWED_TAGS,
    allowedAttributes: {},
    disallowedTagsMode: 'discard',
  }).trim()
}

export function sanitizeHtml(input: string): string {
  if (!input) return ''
  const baseTags = sanitizeHtmlLib.defaults.allowedTags.filter(
    (tag) => !['script', 'iframe', 'object', 'embed', 'form', 'link', 'meta', 'style'].includes(tag)
  )
  return sanitizeHtmlLib(input, {
    allowedTags: [...baseTags, 'img'],
    allowedAttributes: {
      a: ['href', 'title', 'target', 'rel'],
      img: ['src', 'alt', 'width', 'height'],
      p: [],
      br: [],
      strong: [],
      em: [],
      ul: [],
      ol: [],
      li: [],
      h1: [],
      h2: [],
      h3: [],
      h4: [],
      h5: [],
      h6: [],
      blockquote: [],
      code: [],
      pre: [],
      table: [],
      thead: [],
      tbody: [],
      tr: [],
      th: [],
      td: [],
      div: [],
      span: [],
    },
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    allowedSchemesByTag: {},
    allowedSchemesAppliedToAttributes: ['href', 'src'],
    allowProtocolRelative: false,
    disallowedTagsMode: 'discard',
  }).trim()
}

export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const result = { ...obj } as Record<string, unknown>
  for (const key of Object.keys(result)) {
    if (typeof result[key] === 'string') {
      result[key] = sanitizeInput(result[key] as string)
    }
  }
  return result as T
}
