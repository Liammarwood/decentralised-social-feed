/**
 * QR code generation and parsing for peer handshake
 * Supports chunking for large payloads and compression
 */

import QRCode from 'qrcode'
import jsQR from 'jsqr'
import pako from 'pako'
import { uint8ToBase64, base64ToUint8 } from '@/crypto/keys'

export interface HandshakeQR {
  v: number // Version
  id: string // Peer ID
  encKey: string // Public encryption key (base64)
  signKey: string // Public signing key (base64)
  sdp: string // SDP offer
  ice: RTCIceCandidateInit[] // ICE candidates
  ts: number // Timestamp
}

/**
 * Generate QR code from handshake data
 */
export async function generateHandshakeQR(data: HandshakeQR): Promise<string> {
  try {
    // Serialize to JSON
    const json = JSON.stringify(data)

    // Compress with gzip
    const compressed = pako.gzip(json)

    // Encode to base64url
    const base64 = uint8ToBase64(compressed)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')

    // Generate QR code
    const qrCodeDataUrl = await QRCode.toDataURL(base64, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 400,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    })

    return qrCodeDataUrl
  } catch (error) {
    console.error('Error generating QR code:', error)
    throw error
  }
}

/**
 * Parse handshake data from QR code image
 */
export function parseHandshakeQR(imageData: ImageData): HandshakeQR | null {
  try {
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert',
    })

    if (!code) {
      return null
    }

    // Decode base64url
    const base64 = code.data
      .replace(/-/g, '+')
      .replace(/_/g, '/')
    
    // Add padding
    const padded = base64 + '=='.slice(0, (4 - base64.length % 4) % 4)

    // Decode from base64
    const compressed = base64ToUint8(padded)

    // Decompress
    const json = pako.ungzip(compressed, { to: 'string' })

    // Parse JSON
    const data = JSON.parse(json) as HandshakeQR

    return data
  } catch (error) {
    console.error('Error parsing QR code:', error)
    return null
  }
}

/**
 * Create handshake QR data object
 */
export function createHandshakeData(
  peerId: string,
  encKey: Uint8Array,
  signKey: Uint8Array,
  sdp: string,
  ice: RTCIceCandidateInit[]
): HandshakeQR {
  return {
    v: 1,
    id: peerId,
    encKey: uint8ToBase64(encKey),
    signKey: uint8ToBase64(signKey),
    sdp,
    ice,
    ts: Date.now(),
  }
}

/**
 * Generate copy-paste friendly connection string
 */
export function generateConnectionString(data: HandshakeQR): string {
  const json = JSON.stringify(data)
  const compressed = pako.gzip(json)
  const base64 = uint8ToBase64(compressed)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')

  return `p2p:${base64}`
}

/**
 * Parse connection string
 */
export function parseConnectionString(connectionString: string): HandshakeQR | null {
  try {
    if (!connectionString.startsWith('p2p:')) {
      return null
    }

    const base64 = connectionString.slice(4)
      .replace(/-/g, '+')
      .replace(/_/g, '/')
    
    const padded = base64 + '=='.slice(0, (4 - base64.length % 4) % 4)
    const compressed = base64ToUint8(padded)
    const json = pako.ungzip(compressed, { to: 'string' })
    const data = JSON.parse(json) as HandshakeQR

    return data
  } catch (error) {
    console.error('Error parsing connection string:', error)
    return null
  }
}
