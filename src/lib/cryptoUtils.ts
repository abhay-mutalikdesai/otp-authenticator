import type { Algorithm } from '../types'

/**
 * Compute HMAC using Web Crypto API
 */
export async function hmac(algorithm: Algorithm, key: Uint8Array, data: Uint8Array): Promise<Uint8Array> {
  const hashName = algorithm === 'SHA1' ? 'SHA-1' : algorithm === 'SHA256' ? 'SHA-256' : 'SHA-512'
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key as BufferSource,
    { name: 'HMAC', hash: { name: hashName } },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, data as BufferSource)
  return new Uint8Array(signature)
}
