/**
 * IndexedDB storage for local persistence
 * Stores: identity, peers, messages, relay store
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb'
import type { MessageEnvelope } from '@/p2p/protocol'

export interface Peer {
  id: string
  publicSignKey: Uint8Array
  publicEncKey: Uint8Array
  lastSeen: number
  isRelay: boolean
  relayCapacity?: number
}

export interface StoredMessage {
  id: string
  envelope: MessageEnvelope
  status: 'pending' | 'sent' | 'delivered' | 'failed'
  direction: 'inbound' | 'outbound'
  createdAt: number
}

export interface RelayMessage {
  id: string
  envelope: MessageEnvelope
  storedAt: number
  attempts: number
  lastAttempt?: number
}

export interface Identity {
  peerId: string
  keys: any // Exported keypair
  createdAt: number
}

interface P2PDB extends DBSchema {
  identity: {
    key: string
    value: Identity
  }
  peers: {
    key: string
    value: Peer
  }
  messages: {
    key: string
    value: StoredMessage
    indexes: {
      'by-status': string
      'by-direction': string
      'by-created': number
    }
  }
  relayStore: {
    key: string
    value: RelayMessage
    indexes: {
      'by-stored': number
      'by-attempts': number
    }
  }
  cursors: {
    key: string
    value: {
      peerId: string
      cursor: number
    }
  }
}

let db: IDBPDatabase<P2PDB> | null = null

/**
 * Initialize database
 */
export async function initDB(): Promise<IDBPDatabase<P2PDB>> {
  if (db) {
    return db
  }

  db = await openDB<P2PDB>('p2p-social-feed', 1, {
    upgrade(db) {
      // Identity store
      if (!db.objectStoreNames.contains('identity')) {
        db.createObjectStore('identity', { keyPath: 'peerId' })
      }

      // Peers store
      if (!db.objectStoreNames.contains('peers')) {
        db.createObjectStore('peers', { keyPath: 'id' })
      }

      // Messages store
      if (!db.objectStoreNames.contains('messages')) {
        const messageStore = db.createObjectStore('messages', { keyPath: 'id' })
        messageStore.createIndex('by-status', 'status')
        messageStore.createIndex('by-direction', 'direction')
        messageStore.createIndex('by-created', 'createdAt')
      }

      // Relay store
      if (!db.objectStoreNames.contains('relayStore')) {
        const relayStore = db.createObjectStore('relayStore', { keyPath: 'id' })
        relayStore.createIndex('by-stored', 'storedAt')
        relayStore.createIndex('by-attempts', 'attempts')
      }

      // Cursors store
      if (!db.objectStoreNames.contains('cursors')) {
        db.createObjectStore('cursors', { keyPath: 'peerId' })
      }
    },
  })

  return db
}

/**
 * Get database instance
 */
export async function getDB(): Promise<IDBPDatabase<P2PDB>> {
  if (!db) {
    return await initDB()
  }
  return db
}

// Identity operations
export async function saveIdentity(identity: Identity): Promise<void> {
  const db = await getDB()
  await db.put('identity', identity)
}

export async function getIdentity(): Promise<Identity | undefined> {
  const db = await getDB()
  const all = await db.getAll('identity')
  return all[0]
}

// Peer operations
export async function savePeer(peer: Peer): Promise<void> {
  const db = await getDB()
  await db.put('peers', peer)
}

export async function getPeer(id: string): Promise<Peer | undefined> {
  const db = await getDB()
  return await db.get('peers', id)
}

export async function getAllPeers(): Promise<Peer[]> {
  const db = await getDB()
  return await db.getAll('peers')
}

export async function deletePeer(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('peers', id)
}

// Message operations
export async function saveMessage(message: StoredMessage): Promise<void> {
  const db = await getDB()
  await db.put('messages', message)
}

export async function getMessage(id: string): Promise<StoredMessage | undefined> {
  const db = await getDB()
  return await db.get('messages', id)
}

export async function getAllMessages(): Promise<StoredMessage[]> {
  const db = await getDB()
  return await db.getAll('messages')
}

export async function getMessagesByStatus(status: string): Promise<StoredMessage[]> {
  const db = await getDB()
  return await db.getAllFromIndex('messages', 'by-status', status)
}

export async function deleteMessage(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('messages', id)
}

// Relay store operations
export async function saveRelayMessage(message: RelayMessage): Promise<void> {
  const db = await getDB()
  await db.put('relayStore', message)
}

export async function getRelayMessage(id: string): Promise<RelayMessage | undefined> {
  const db = await getDB()
  return await db.get('relayStore', id)
}

export async function getAllRelayMessages(): Promise<RelayMessage[]> {
  const db = await getDB()
  return await db.getAll('relayStore')
}

export async function deleteRelayMessage(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('relayStore', id)
}

// Cursor operations
export async function saveCursor(peerId: string, cursor: number): Promise<void> {
  const db = await getDB()
  await db.put('cursors', { peerId, cursor })
}

export async function getCursor(peerId: string): Promise<number> {
  const db = await getDB()
  const result = await db.get('cursors', peerId)
  return result?.cursor || 0
}

export async function getAllCursors(): Promise<{ [peerId: string]: number }> {
  const db = await getDB()
  const all = await db.getAll('cursors')
  const cursors: { [peerId: string]: number } = {}
  for (const item of all) {
    cursors[item.peerId] = item.cursor
  }
  return cursors
}
