import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const KEY_LENGTH = 32
const IV_LENGTH = 16
const AUTH_TAG_LENGTH = 16
const SALT_LENGTH = 16

function getKey(): Buffer {
  const secret = process.env.ENCRYPTION_KEY
  if (!secret) {
    throw new Error('ENCRYPTION_KEY environment variable is required')
  }
  const salt = process.env.ENCRYPTION_SALT || crypto.createHash('sha256').update(secret).digest('hex').slice(0, SALT_LENGTH * 2)
  const key = crypto.scryptSync(secret, salt, KEY_LENGTH)
  return key
}

export function encrypt(plaintext: string): string {
  if (!plaintext) return ''

  const key = getKey()
  const iv = crypto.randomBytes(IV_LENGTH)
  const salt = crypto.randomBytes(SALT_LENGTH)

  const derivedKey = crypto.scryptSync(key, salt, KEY_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, derivedKey, iv)

  let encrypted = cipher.update(plaintext, 'utf8', 'base64')
  encrypted += cipher.final('base64')

  const authTag = cipher.getAuthTag()

  return [
    salt.toString('base64'),
    iv.toString('base64'),
    authTag.toString('base64'),
    encrypted,
  ].join(':')
}

export function decrypt(ciphertext: string): string {
  if (!ciphertext) return ''

  const parts = ciphertext.split(':')
  if (parts.length !== 4) {
    throw new Error('Invalid encrypted data format')
  }

  const [saltB64, ivB64, authTagB64, encrypted] = parts

  const key = getKey()
  const salt = Buffer.from(saltB64, 'base64')
  const iv = Buffer.from(ivB64, 'base64')
  const authTag = Buffer.from(authTagB64, 'base64')

  const derivedKey = crypto.scryptSync(key, salt, KEY_LENGTH)
  const decipher = crypto.createDecipheriv(ALGORITHM, derivedKey, iv)
  decipher.setAuthTag(authTag)

  let decrypted = decipher.update(encrypted, 'base64', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}

export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString('hex')
}
