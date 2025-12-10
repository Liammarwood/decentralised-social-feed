# Protocol Specification

## Overview

This document specifies the protocols used in the P2P Social Feed application for peer discovery, connection establishment, message exchange, and relay forwarding.

## 1. Handshake Protocol

### 1.1 QR Code Handshake

The QR code contains compressed connection information for establishing a WebRTC peer connection.

#### Format

```typescript
interface HandshakeQR {
  v: number              // Protocol version (current: 1)
  id: string             // Peer ID (32-char hex string)
  encKey: string         // Public encryption key (base64)
  signKey: string        // Public signing key (base64)
  sdp: string            // WebRTC SDP offer
  ice: RTCIceCandidateInit[]  // ICE candidates
  ts: number             // Unix timestamp (milliseconds)
}
```

#### Encoding Process

1. Serialize handshake object to JSON
2. Compress with gzip (pako)
3. Encode to base64url (URL-safe base64)
4. Generate QR code from base64url string

#### Example

```
Raw JSON (simplified):
{
  "v": 1,
  "id": "a1b2c3d4...",
  "encKey": "MEUC...",
  "signKey": "MCow...",
  "sdp": "v=0\r\no=...",
  "ice": [...],
  "ts": 1702234567890
}

After compression and encoding:
p2p:H4sIAAAAAAAAA...
```

### 1.2 Connection String

For environments without QR scanner, connection data can be shared as text:

```
Format: p2p:<base64url-compressed-data>
Example: p2p:H4sIAAAAAAAAA6tWKkktLlGyUorRd...
```

### 1.3 Handshake Flow

```
Alice (Initiator)                    Bob (Responder)
     |                                    |
     |  1. Generate identity keys         |
     |  2. Create WebRTC offer            |
     |  3. Gather ICE candidates          |
     |  4. Generate QR code               |
     |                                    |
     |     [QR Code / Connection String]  |
     |---------------------------------->>|
     |                                    |
     |                              5. Scan QR
     |                              6. Parse handshake
     |                              7. Create answer
     |                              8. Establish connection
     |                                    |
     |     [WebRTC Connection Active]     |
     |<<==================================>>|
```

## 2. Message Envelope Schema

All messages exchanged between peers use a standard envelope format.

### 2.1 Envelope Structure

```typescript
interface MessageEnvelope {
  id: string           // Unique message ID (timestamp_random)
  from: string         // Sender peer ID
  to: string           // Recipient peer ID
  type: 'direct' | 'relay'  // Message type
  seq: number          // Sequence number (per sender)
  ts: number           // Unix timestamp (milliseconds)
  ttl: number          // Time-to-live (seconds)
  hops_left: number    // Remaining relay hops
  ciphertext: string   // Encrypted message (base64)
  iv: string           // AES-GCM IV (base64)
  sig: string          // Ed25519 signature (base64)
  meta?: any           // Optional metadata
}
```

### 2.2 Encryption

1. **Key Agreement**: ECDH between sender's private key and recipient's public key
2. **Key Derivation**: HKDF with salt and context info
3. **Encryption**: AES-GCM with random IV
4. **Authentication**: Ed25519 signature over entire envelope

```
Plaintext Message → AES-GCM Encrypt → Ciphertext
                         ↓
                    Sign with Ed25519 → Signature
```

### 2.3 Signature Verification

Signature is computed over canonical JSON representation of envelope fields (excluding `sig`):

```typescript
const dataToSign = JSON.stringify({
  id, from, to, type, seq, ts, ttl,
  hops_left, ciphertext, iv, meta
})
```

## 3. Sync Protocol

Peers synchronize messages using a JSON-RPC style protocol over WebRTC data channel.

### 3.1 Message Types

#### STATE

Exchange current sync state (last sequence number per peer):

```typescript
{
  type: 'STATE',
  payload: {
    peerId: string,
    cursors: {
      [peerId: string]: number  // Last seq for each peer
    }
  }
}
```

#### REQUEST

Request missing messages:

```typescript
{
  type: 'REQUEST',
  payload: {
    peerId: string,  // Peer whose messages to fetch
    ranges: [
      { start: number, end: number }
    ]
  }
}
```

#### BATCH

Send batch of message envelopes:

```typescript
{
  type: 'BATCH',
  payload: {
    peerId: string,
    envelopes: MessageEnvelope[]
  }
}
```

#### ACK

Acknowledge message delivery:

```typescript
{
  type: 'ACK',
  payload: {
    messageIds: string[]
  }
}
```

#### RELAY_PUSH

Forward message through relay:

```typescript
{
  type: 'RELAY_PUSH',
  payload: {
    envelope: MessageEnvelope,
    fromRelay: string  // Relay node ID
  }
}
```

### 3.2 Sync Flow

```
Peer A                              Peer B
  |                                   |
  |  STATE (cursors)                  |
  |---------------------------------->|
  |                                   |
  |  STATE (cursors)                  |
  |<----------------------------------|
  |                                   |
  |  REQUEST (missing ranges)         |
  |---------------------------------->|
  |                                   |
  |  BATCH (envelopes)                |
  |<----------------------------------|
  |                                   |
  |  ACK (message IDs)                |
  |---------------------------------->|
```

## 4. Relay Protocol

### 4.1 Store-and-Forward Algorithm

When recipient is offline:

1. Sender sends envelope to one or more relay nodes
2. Relay stores encrypted envelope in IndexedDB
3. Relay periodically attempts delivery:
   - Try direct connection to recipient
   - If fails and `hops_left > 0`, forward to other relays
4. On successful delivery, recipient sends ACK
5. Relay deletes message from store

### 4.2 TTL and Hops

- **TTL**: Message expires after TTL seconds from creation
- **Hops**: Message can be forwarded max `hops_left` times
- Each relay decrements `hops_left` by 1
- Messages with `hops_left = 0` are not forwarded

### 4.3 Retry Strategy

Exponential backoff for failed delivery attempts:

```
Attempt 1: immediate
Attempt 2: 2 seconds
Attempt 3: 4 seconds
Attempt 4: 8 seconds
...
Max attempts: 10
```

### 4.4 Relay Selection

When choosing relays:

1. Prefer relays with direct connection to sender
2. Prefer relays with high uptime history
3. Distribute across multiple relays for redundancy

### 4.5 Storage Limits

Each relay node has configurable limits:

- **maxStorage**: Maximum number of messages to store
- **maxTTL**: Maximum TTL accepted (e.g., 24 hours)
- **maxHops**: Maximum hops accepted (e.g., 5)

When limits exceeded, relay rejects new messages.

## 5. Sequence Numbers

Each peer maintains sequence numbers for ordering:

- **Local Sequence**: Counter for own messages
- **Remote Cursors**: Last sequence received from each peer

Sequence numbers enable:
- Detecting missing messages
- Efficient sync (only fetch gaps)
- Ordering messages chronologically

## 6. Security Considerations

### 6.1 Message Authentication

- Every envelope signed with Ed25519
- Recipients verify signature before processing
- Prevents message tampering and forgery

### 6.2 Replay Protection

- Unique message IDs (timestamp + random)
- Recipients track processed message IDs
- Duplicate messages are rejected

### 6.3 Forward Secrecy

Current implementation uses static identity keys. For forward secrecy:
- Implement ephemeral key exchange per session
- Use Double Ratchet algorithm (Signal Protocol)
- Rotate keys periodically

### 6.4 Relay Privacy

- Relays cannot decrypt message content
- Relays see: sender ID, recipient ID, size, TTL, hops
- Consider onion routing for stronger anonymity

## 7. Error Handling

### 7.1 Connection Failures

- WebRTC connection state monitoring
- Automatic reconnection with exponential backoff
- Fallback to relay if direct connection fails

### 7.2 Message Delivery Failures

- Store undelivered messages locally
- Retry with exponential backoff
- Mark as failed after max attempts
- Option to resend manually

### 7.3 Malformed Messages

- Validate all incoming messages
- Reject invalid envelopes
- Log errors for debugging
- Don't crash on invalid input

## 8. Future Extensions

### 8.1 Group Messaging

- Multi-recipient envelopes
- Shared group keys
- Member management protocol

### 8.2 Attachments

- Chunked file transfer
- IPFS/Bittorrent for large files
- Resume interrupted transfers

### 8.3 Presence

- Heartbeat messages
- Online/offline status
- Last seen timestamps

### 8.4 Discovery

- DHT for peer discovery
- Relay directory service
- Friend-of-friend discovery

## Appendix A: Constants

```typescript
// Protocol version
const PROTOCOL_VERSION = 1

// Crypto parameters
const SIGNATURE_ALGORITHM = 'Ed25519'
const ENCRYPTION_ALGORITHM = 'AES-GCM'
const KEY_AGREEMENT_CURVE = 'P-256'
const AES_KEY_LENGTH = 256
const GCM_IV_LENGTH = 12

// Message limits
const MAX_MESSAGE_SIZE = 1048576  // 1 MB
const MAX_TTL = 604800            // 7 days
const MAX_HOPS = 5
const DEFAULT_TTL = 86400         // 24 hours

// Retry parameters
const MAX_RETRY_ATTEMPTS = 10
const INITIAL_RETRY_DELAY = 2000  // 2 seconds
const MAX_RETRY_DELAY = 300000    // 5 minutes
```

## Appendix B: Example Messages

### Handshake QR Content

```json
{
  "v": 1,
  "id": "a1b2c3d4e5f67890a1b2c3d4e5f67890",
  "encKey": "MEUCIQD...",
  "signKey": "MCowBQ...",
  "sdp": "v=0\r\no=- 123456789 2 IN IP4 127.0.0.1\r\n...",
  "ice": [
    {
      "candidate": "candidate:1 1 UDP 2130706431...",
      "sdpMid": "0",
      "sdpMLineIndex": 0
    }
  ],
  "ts": 1702234567890
}
```

### Message Envelope

```json
{
  "id": "1702234567890_a1b2c3",
  "from": "a1b2c3d4e5f67890a1b2c3d4e5f67890",
  "to": "f0e1d2c3b4a5968778695a4b3c2d1e0f",
  "type": "direct",
  "seq": 42,
  "ts": 1702234567890,
  "ttl": 86400,
  "hops_left": 5,
  "ciphertext": "q7w8e9r0t1y2u3i4o5p6...",
  "iv": "a1s2d3f4g5h6j7k8l9z0",
  "sig": "x1c2v3b4n5m6q7w8e9r0..."
}
```

### STATE Message

```json
{
  "type": "STATE",
  "payload": {
    "peerId": "a1b2c3d4e5f67890a1b2c3d4e5f67890",
    "cursors": {
      "a1b2c3d4e5f67890a1b2c3d4e5f67890": 42,
      "f0e1d2c3b4a5968778695a4b3c2d1e0f": 17
    }
  }
}
```
