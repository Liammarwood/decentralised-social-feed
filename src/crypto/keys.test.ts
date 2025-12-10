import { describe, it, expect } from 'vitest'
import { uint8ToBase64, base64ToUint8, generatePeerId } from './keys'

describe('Crypto Utilities', () => {
  it('should convert Uint8Array to base64 and back', () => {
    const original = new Uint8Array([1, 2, 3, 4, 5])
    const base64 = uint8ToBase64(original)
    const decoded = base64ToUint8(base64)

    expect(decoded).toEqual(original)
  })

  it('should generate unique peer IDs', () => {
    const id1 = generatePeerId()
    const id2 = generatePeerId()

    expect(id1).not.toBe(id2)
    expect(id1).toHaveLength(32)
    expect(id2).toHaveLength(32)
  })

  it('should handle empty Uint8Array', () => {
    const original = new Uint8Array([])
    const base64 = uint8ToBase64(original)
    const decoded = base64ToUint8(base64)

    expect(decoded).toEqual(original)
  })
})
