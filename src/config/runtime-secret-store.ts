import crypto from 'crypto'

function getSeedSecret(): string {
  return process.env.JWT_SECRET || 'fallback-secret-for-development-only'
}

function deriveKey(secret: string): Buffer {
  return crypto.createHash('sha256').update(secret).digest()
}

export function encryptRuntimeSecret(plaintext: string): string {
  const key = deriveKey(getSeedSecret())
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, encrypted]).toString('base64')
}

export function decryptRuntimeSecret(dataB64: string): string {
  const data = Buffer.from(dataB64, 'base64')
  const key = deriveKey(getSeedSecret())
  const iv = data.slice(0, 12)
  const tag = data.slice(12, 28)
  const ciphertext = data.slice(28)
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8')
}

export function readRuntimeSettingValue(key: string): string | undefined {
  const envValue = (process.env as any)[key]
  if (envValue) return envValue

  try {
    const { getDb } = require('../db/sqlite')
    const db = getDb()
    const row = db
      .prepare('SELECT value_encrypted FROM runtime_settings WHERE key = ? LIMIT 1')
      .get(key)
    if (!row?.value_encrypted) return undefined
    return decryptRuntimeSecret(row.value_encrypted)
  } catch {
    return undefined
  }
}
