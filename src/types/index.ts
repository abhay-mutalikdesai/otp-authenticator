// ============================================================
// Core Types — OTP Authenticator
// ============================================================

export type OtpType = 'totp' | 'hotp'
export type Algorithm = 'SHA1' | 'SHA256' | 'SHA512'
export type Encoding = 'auto' | 'base32' | 'base64' | 'hex'
export type Theme = 'light' | 'dark' | 'system'

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
  mpReminderDismissed: boolean   // "Don't show again" on the master-password nudge
  mpReminderSnoozeUntil: number  // "Remind me later" — epoch ms, 0 = not snoozed
}

export interface OtpData {
  code: string
  secondsLeft: number
  progress: number
}

export interface ValidationResult {
  valid: boolean
  preview: string | null
  error: string | null
}
