/**
 * P2P Protocol for message synchronization and relay
 * JSON-RPC style messages over WebRTC data channel
 */

export interface MessageEnvelope {
  id: string // Unique message ID
  from: string // Sender peer ID
  to: string // Recipient peer ID
  type: 'direct' | 'relay' // Message type
  seq: number // Sequence number
  ts: number // Timestamp
  ttl: number // Time-to-live (seconds)
  hops_left: number // Remaining hops for relay
  ciphertext: string // Encrypted message content (base64)
  iv: string // IV for decryption (base64)
  sig: string // Signature (base64)
  meta?: any // Optional metadata
}

export interface ProtocolMessage {
  type: 'STATE' | 'REQUEST' | 'BATCH' | 'ACK' | 'RELAY_PUSH' | 'PING' | 'PONG'
  payload: any
}

export interface StateMessage {
  peerId: string
  cursors: { [peerId: string]: number } // Last sequence number per peer
}

export interface RequestMessage {
  peerId: string
  ranges: Array<{ start: number; end: number }>
}

export interface BatchMessage {
  peerId: string
  envelopes: MessageEnvelope[]
}

export interface AckMessage {
  messageIds: string[]
}

export interface RelayPushMessage {
  envelope: MessageEnvelope
  fromRelay: string
}

/**
 * Create STATE message
 */
export function createStateMessage(
  peerId: string,
  cursors: { [peerId: string]: number }
): ProtocolMessage {
  return {
    type: 'STATE',
    payload: {
      peerId,
      cursors,
    } as StateMessage,
  }
}

/**
 * Create REQUEST message
 */
export function createRequestMessage(
  peerId: string,
  ranges: Array<{ start: number; end: number }>
): ProtocolMessage {
  return {
    type: 'REQUEST',
    payload: {
      peerId,
      ranges,
    } as RequestMessage,
  }
}

/**
 * Create BATCH message
 */
export function createBatchMessage(
  peerId: string,
  envelopes: MessageEnvelope[]
): ProtocolMessage {
  return {
    type: 'BATCH',
    payload: {
      peerId,
      envelopes,
    } as BatchMessage,
  }
}

/**
 * Create ACK message
 */
export function createAckMessage(messageIds: string[]): ProtocolMessage {
  return {
    type: 'ACK',
    payload: {
      messageIds,
    } as AckMessage,
  }
}

/**
 * Create RELAY_PUSH message
 */
export function createRelayPushMessage(
  envelope: MessageEnvelope,
  fromRelay: string
): ProtocolMessage {
  return {
    type: 'RELAY_PUSH',
    payload: {
      envelope,
      fromRelay,
    } as RelayPushMessage,
  }
}

/**
 * Create PING message
 */
export function createPingMessage(): ProtocolMessage {
  return {
    type: 'PING',
    payload: {},
  }
}

/**
 * Create PONG message
 */
export function createPongMessage(): ProtocolMessage {
  return {
    type: 'PONG',
    payload: {},
  }
}

/**
 * Validate message envelope
 */
export function validateEnvelope(envelope: MessageEnvelope): boolean {
  if (!envelope.id || !envelope.from || !envelope.to) {
    return false
  }
  if (envelope.hops_left < 0) {
    return false
  }
  if (envelope.ttl <= 0) {
    return false
  }
  return true
}

/**
 * Check if message has expired
 */
export function isExpired(envelope: MessageEnvelope): boolean {
  const now = Date.now()
  const age = (now - envelope.ts) / 1000 // seconds
  return age > envelope.ttl
}

/**
 * Decrement hops and check if relay should continue
 */
export function decrementHops(envelope: MessageEnvelope): MessageEnvelope {
  return {
    ...envelope,
    hops_left: envelope.hops_left - 1,
  }
}

/**
 * Calculate missing sequence ranges
 */
export function calculateMissingRanges(
  localCursor: number,
  remoteCursor: number
): Array<{ start: number; end: number }> {
  if (localCursor >= remoteCursor) {
    return []
  }

  return [{ start: localCursor + 1, end: remoteCursor }]
}
