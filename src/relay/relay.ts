/**
 * Relay logic for store-and-forward messaging
 * Relays store encrypted envelopes and forward to recipients or other relays
 */

import type { MessageEnvelope } from '@/p2p/protocol'
import { validateEnvelope, isExpired, decrementHops } from '@/p2p/protocol'
import {
  saveRelayMessage,
  getRelayMessage,
  getAllRelayMessages,
  deleteRelayMessage,
  type RelayMessage,
} from '@/storage/indexeddb'

export interface RelayConfig {
  enabled: boolean
  maxStorage: number // Max messages to store
  maxTTL: number // Max TTL in seconds
  maxHops: number // Max hops to forward
  forwardInterval: number // Interval to attempt forwards (ms)
}

export class RelayManager {
  private config: RelayConfig
  private forwardTimer: number | null = null
  private onForwardMessage?: (envelope: MessageEnvelope, toPeerId: string) => void

  constructor(config: RelayConfig) {
    this.config = config
  }

  /**
   * Set forward message callback
   */
  setForwardCallback(callback: (envelope: MessageEnvelope, toPeerId: string) => void): void {
    this.onForwardMessage = callback
  }

  /**
   * Start relay service
   */
  start(): void {
    if (!this.config.enabled) {
      return
    }

    console.log('Starting relay service...')

    // Start forward attempts
    this.forwardTimer = window.setInterval(() => {
      this.attemptForwards()
    }, this.config.forwardInterval)

    // Clean up expired messages
    this.cleanupExpired()
  }

  /**
   * Stop relay service
   */
  stop(): void {
    if (this.forwardTimer) {
      clearInterval(this.forwardTimer)
      this.forwardTimer = null
    }
  }

  /**
   * Store message for relay
   */
  async storeMessage(envelope: MessageEnvelope): Promise<boolean> {
    if (!this.config.enabled) {
      return false
    }

    // Validate envelope
    if (!validateEnvelope(envelope)) {
      console.warn('Invalid envelope, rejecting')
      return false
    }

    // Check if expired
    if (isExpired(envelope)) {
      console.warn('Expired envelope, rejecting')
      return false
    }

    // Check if we have capacity
    const stored = await getAllRelayMessages()
    if (stored.length >= this.config.maxStorage) {
      console.warn('Relay storage full, rejecting')
      return false
    }

    // Check if we already have this message
    const existing = await getRelayMessage(envelope.id)
    if (existing) {
      console.log('Message already stored')
      return true
    }

    // Store message
    const relayMessage: RelayMessage = {
      id: envelope.id,
      envelope,
      storedAt: Date.now(),
      attempts: 0,
    }

    await saveRelayMessage(relayMessage)
    console.log('Stored message for relay:', envelope.id)

    return true
  }

  /**
   * Attempt to forward stored messages
   */
  private async attemptForwards(): Promise<void> {
    const messages = await getAllRelayMessages()

    for (const message of messages) {
      // Check if expired
      if (isExpired(message.envelope)) {
        console.log('Message expired, removing:', message.id)
        await deleteRelayMessage(message.id)
        continue
      }

      // Check if too many attempts
      if (message.attempts >= 10) {
        console.log('Too many attempts, removing:', message.id)
        await deleteRelayMessage(message.id)
        continue
      }

      // Check if should retry (exponential backoff)
      const backoff = Math.pow(2, message.attempts) * 1000
      if (message.lastAttempt && Date.now() - message.lastAttempt < backoff) {
        continue
      }

      // Try to forward
      await this.forwardMessage(message)
    }
  }

  /**
   * Forward message to recipient or another relay
   */
  private async forwardMessage(message: RelayMessage): Promise<void> {
    if (!this.onForwardMessage) {
      return
    }

    // Check if we can forward (hops left)
    if (message.envelope.hops_left <= 0) {
      console.log('No hops left, removing:', message.id)
      await deleteRelayMessage(message.id)
      return
    }

    // Decrement hops
    const updatedEnvelope = decrementHops(message.envelope)

    // Attempt forward to recipient
    try {
      this.onForwardMessage(updatedEnvelope, updatedEnvelope.to)

      // Update attempt count
      message.attempts += 1
      message.lastAttempt = Date.now()
      message.envelope = updatedEnvelope
      await saveRelayMessage(message)

      console.log('Forward attempt:', message.id, 'attempt', message.attempts)
    } catch (error) {
      console.error('Forward failed:', error)

      // Update attempt count
      message.attempts += 1
      message.lastAttempt = Date.now()
      await saveRelayMessage(message)
    }
  }

  /**
   * Acknowledge message delivery
   */
  async acknowledgeMessage(messageId: string): Promise<void> {
    const message = await getRelayMessage(messageId)
    if (message) {
      console.log('Message delivered, removing from relay:', messageId)
      await deleteRelayMessage(messageId)
    }
  }

  /**
   * Clean up expired messages
   */
  private async cleanupExpired(): Promise<void> {
    const messages = await getAllRelayMessages()

    for (const message of messages) {
      if (isExpired(message.envelope)) {
        console.log('Cleaning up expired message:', message.id)
        await deleteRelayMessage(message.id)
      }
    }
  }

  /**
   * Get relay statistics
   */
  async getStats(): Promise<{
    stored: number
    capacity: number
    enabled: boolean
  }> {
    const messages = await getAllRelayMessages()

    return {
      stored: messages.length,
      capacity: this.config.maxStorage,
      enabled: this.config.enabled,
    }
  }
}

/**
 * Default relay configuration
 */
export const defaultRelayConfig: RelayConfig = {
  enabled: true,
  maxStorage: 100,
  maxTTL: 86400, // 24 hours
  maxHops: 5,
  forwardInterval: 30000, // 30 seconds
}
