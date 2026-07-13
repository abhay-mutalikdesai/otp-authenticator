// ============================================================
// Core Types — OTP Authenticator
// ============================================================

export type OtpType = 'totp' | 'hotp'
export type Algorithm = 'SHA1' | 'SHA256' | 'SHA512'
export type Encoding = 'auto' | 'base32' | 'base64' | 'hex'
type Theme = 'light' | 'dark' | 'system'

export interface OtpEntry {
  id: string
  type: OtpType
  issuer: string
  account: string
  secret: string
  encoding: Encoding
  algorithm: Algorithm
  digits: number
  period: number        // TOTP: seconds per period
  counter: number       // HOTP: local counter
  favourite: boolean
  order: number
  createdAt: string
}

export interface AppSettings {
  theme: Theme
  defaultDigits: number
  defaultAlgorithm: Algorithm
  defaultPeriod: number
  showOtp: boolean
  autoLockMinutes: number  // 0 = never
  // Epoch ms until the master-password nudge is hidden, 0 = not snoozed. "Remind me later"
  // sets a short snooze; "Don't show again" sets a long (but bounded) one — bounded so the
  // security reminder can never get silenced forever with no way back.
  mpReminderSnoozeUntil: number
  windowMode?: boolean
}



export interface ValidationResult {
  valid: boolean
  preview: string | null
  error: string | null
}
