/**
 * Cryptography module for E2E encryption using Web Crypto API
 * - Ed25519 for signing (identity verification)
 * - X25519 for key agreement (ECDH)
 * - AES-GCM for symmetric encryption
 * - HKDF for key derivation
 */

export interface IdentityKeyPair {
  signKeyPair: CryptoKeyPair
  encKeyPair: CryptoKeyPair
  publicSignKey: Uint8Array
  publicEncKey: Uint8Array
}

/**
 * Generate a new identity keypair (Ed25519 for signing, X25519 for encryption)
 */
export async function generateIdentityKeys(): Promise<IdentityKeyPair> {
  // Generate Ed25519 keypair for signing
  const signKeyPair = await crypto.subtle.generateKey(
    {
      name: 'Ed25519',
    },
    true,
    ['sign', 'verify']
  )

  // Generate ECDH keypair for key agreement (using P-256 as X25519 not widely supported yet)
  const encKeyPair = await crypto.subtle.generateKey(
    {
      name: 'ECDH',
      namedCurve: 'P-256',
    },
    true,
    ['deriveKey', 'deriveBits']
  )

  // Export public keys
  const publicSignKey = new Uint8Array(
    await crypto.subtle.exportKey('raw', signKeyPair.publicKey)
  )
  const publicEncKey = new Uint8Array(
    await crypto.subtle.exportKey('raw', encKeyPair.publicKey)
  )

  return {
    signKeyPair,
    encKeyPair,
    publicSignKey,
    publicEncKey,
  }
}

/**
 * Export keypair to IndexedDB-compatible format
 */
export async function exportKeyPair(keyPair: IdentityKeyPair): Promise<any> {
  const privateSignKey = await crypto.subtle.exportKey('pkcs8', keyPair.signKeyPair.privateKey)
  const publicSignKey = await crypto.subtle.exportKey('raw', keyPair.signKeyPair.publicKey)
  const privateEncKey = await crypto.subtle.exportKey('pkcs8', keyPair.encKeyPair.privateKey)
  const publicEncKey = await crypto.subtle.exportKey('raw', keyPair.encKeyPair.publicKey)

  return {
    privateSignKey: Array.from(new Uint8Array(privateSignKey)),
    publicSignKey: Array.from(new Uint8Array(publicSignKey)),
    privateEncKey: Array.from(new Uint8Array(privateEncKey)),
    publicEncKey: Array.from(new Uint8Array(publicEncKey)),
  }
}

/**
 * Import keypair from storage
 */
export async function importKeyPair(exported: any): Promise<IdentityKeyPair> {
  const privateSignKey = await crypto.subtle.importKey(
    'pkcs8',
    new Uint8Array(exported.privateSignKey),
    { name: 'Ed25519' },
    true,
    ['sign']
  )
  const publicSignKey = await crypto.subtle.importKey(
    'raw',
    new Uint8Array(exported.publicSignKey),
    { name: 'Ed25519' },
    true,
    ['verify']
  )
  const privateEncKey = await crypto.subtle.importKey(
    'pkcs8',
    new Uint8Array(exported.privateEncKey),
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveKey', 'deriveBits']
  )
  const publicEncKey = await crypto.subtle.importKey(
    'raw',
    new Uint8Array(exported.publicEncKey),
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    []
  )

  return {
    signKeyPair: { privateKey: privateSignKey, publicKey: publicSignKey },
    encKeyPair: { privateKey: privateEncKey, publicKey: publicEncKey },
    publicSignKey: new Uint8Array(exported.publicSignKey),
    publicEncKey: new Uint8Array(exported.publicEncKey),
  }
}

/**
 * Derive shared secret using ECDH
 */
export async function deriveSharedSecret(
  privateKey: CryptoKey,
  publicKey: CryptoKey
): Promise<CryptoKey> {
  return await crypto.subtle.deriveKey(
    { name: 'ECDH', public: publicKey },
    privateKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

/**
 * Derive encryption key from shared secret using HKDF
 */
export async function deriveEncryptionKey(
  sharedSecret: ArrayBuffer,
  salt: BufferSource,
  info: BufferSource
): Promise<CryptoKey> {
  const baseKey = await crypto.subtle.importKey(
    'raw',
    sharedSecret,
    { name: 'HKDF' },
    false,
    ['deriveKey']
  )

  return await crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt,
      info,
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

/**
 * Encrypt data with AES-GCM
 */
export async function encrypt(
  data: BufferSource,
  key: CryptoKey
): Promise<{ ciphertext: Uint8Array; iv: Uint8Array }> {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  )

  return {
    ciphertext: new Uint8Array(ciphertext),
    iv,
  }
}

/**
 * Decrypt data with AES-GCM
 */
export async function decrypt(
  ciphertext: BufferSource,
  key: CryptoKey,
  iv: BufferSource
): Promise<Uint8Array> {
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  )

  return new Uint8Array(plaintext)
}

/**
 * Sign data with Ed25519
 */
export async function sign(data: BufferSource, privateKey: CryptoKey): Promise<Uint8Array> {
  const signature = await crypto.subtle.sign({ name: 'Ed25519' }, privateKey, data)
  return new Uint8Array(signature)
}

/**
 * Verify signature with Ed25519
 */
export async function verify(
  data: BufferSource,
  signature: BufferSource,
  publicKey: CryptoKey
): Promise<boolean> {
  return await crypto.subtle.verify({ name: 'Ed25519' }, publicKey, signature, data)
}

/**
 * Import public encryption key from raw bytes
 */
export async function importPublicEncKey(publicKeyBytes: BufferSource): Promise<CryptoKey> {
  return await crypto.subtle.importKey(
    'raw',
    publicKeyBytes,
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    []
  )
}

/**
 * Import public signing key from raw bytes
 */
export async function importPublicSignKey(publicKeyBytes: BufferSource): Promise<CryptoKey> {
  return await crypto.subtle.importKey(
    'raw',
    publicKeyBytes,
    { name: 'Ed25519' },
    true,
    ['verify']
  )
}

/**
 * Utility: Convert Uint8Array to base64
 */
export function uint8ToBase64(arr: Uint8Array): string {
  return btoa(String.fromCharCode(...arr))
}

/**
 * Utility: Convert base64 to Uint8Array
 */
export function base64ToUint8(str: string): Uint8Array {
  return Uint8Array.from(atob(str), c => c.charCodeAt(0))
}

/**
 * Utility: Generate random peer ID
 */
export function generatePeerId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')
}
