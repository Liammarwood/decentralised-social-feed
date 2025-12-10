# Decentralized P2P Social Feed

A privacy-first, peer-to-peer social network built with React, TypeScript, and WebRTC. Features end-to-end encryption, offline messaging through relay nodes, and QR code-based peer discovery.

## Features

- **Peer-to-Peer Communication**: Direct WebRTC connections between users
- **End-to-End Encryption**: All messages encrypted with Ed25519 signing and ECDH key agreement
- **Store-and-Forward Relay**: Offline message delivery through friend relay nodes
- **QR Code Handshake**: Easy peer discovery and connection via QR codes
- **Offline-First**: Local-first architecture with IndexedDB persistence
- **PWA Support**: Installable on desktop and mobile devices
- **No Central Server**: Fully decentralized with no single point of failure

## Architecture

### Technology Stack

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **P2P Transport**: Native WebRTC `RTCPeerConnection` + reliable `RTCDataChannel`
- **Crypto**: Web Crypto API (Ed25519 signing, ECDH key agreement, AES-GCM encryption)
- **Storage**: IndexedDB (via `idb` library)
- **QR Codes**: qrcode + jsqr + pako (compression)
- **CRDT**: Automerge (for feed synchronization)

### Key Components

1. **Crypto Module** (`src/crypto/keys.ts`)
   - Identity keypair generation (Ed25519 + ECDH)
   - Key derivation with HKDF
   - AES-GCM encryption/decryption
   - Message signing and verification

2. **WebRTC Module** (`src/p2p/webrtc.ts`)
   - RTCPeerConnection wrapper
   - Reliable data channel setup
   - Offer/answer exchange
   - ICE candidate handling

3. **QR Module** (`src/p2p/qr.ts`)
   - Handshake QR generation
   - QR parsing and validation
   - Connection string generation
   - Gzip compression for smaller QR codes

4. **Protocol Module** (`src/p2p/protocol.ts`)
   - JSON-RPC message format
   - STATE, REQUEST, BATCH, ACK messages
   - Message envelope schema
   - TTL and hops management

5. **Storage Module** (`src/storage/indexeddb.ts`)
   - Identity persistence
   - Peer management
   - Message storage
   - Relay store
   - Sequence cursors

6. **Relay Module** (`src/relay/relay.ts`)
   - Store-and-forward logic
   - Message routing
   - TTL enforcement
   - Exponential backoff for retries

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Modern browser with WebRTC support

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run tests
npm test
```

### Two-Tab Demo (Copy/Paste Flow)

Since QR scanning requires camera access, you can test P2P connections using two browser tabs:

1. **Tab 1 (Alice)**:
   - Open `http://localhost:5173`
   - Navigate to "Share" tab
   - Click "Generate QR Code"
   - Copy the connection string

2. **Tab 2 (Bob)**:
   - Open `http://localhost:5173` in a new tab
   - Navigate to "Scan" tab
   - Paste the connection string
   - Click "Connect"

3. **Verify Connection**:
   - Both tabs should show "Connection state: connected"
   - In Tab 2, click "Send Test Message" to send a PING
   - Check browser console for received messages

4. **Test Messaging**:
   - Navigate to "Chat" tab in both tabs
   - Select the peer
   - Send messages back and forth

### QR Code Demo (Mobile)

1. **Device 1**:
   - Open the app
   - Go to "Share" tab
   - Generate QR code

2. **Device 2**:
   - Open the app
   - Go to "Scan" tab
   - Open camera and scan the QR code
   - Connection establishes automatically

## Protocol Details

See [SPEC.md](SPEC.md) for detailed protocol specifications.

## Security

### Encryption

- **Identity Keys**: Ed25519 (signing) + ECDH P-256 (key agreement)
- **Message Encryption**: AES-GCM with per-message keys
- **Key Derivation**: ECDH + HKDF for shared secrets
- **Signatures**: Ed25519 signatures on all message envelopes

### Privacy

- **E2E Encryption**: All message content is encrypted end-to-end
- **Relay Blindness**: Relay nodes cannot decrypt message content
- **No Metadata Leaks**: Relays only see encrypted envelopes with TTL/hops
- **Local Storage**: All data stored locally in IndexedDB

### Trust Model

- **Web of Trust**: Users only connect to peers they explicitly add
- **No PKI**: No certificate authorities or centralized identity
- **Self-Sovereign**: Users control their own keys and data

## Relay System

### How It Works

1. **Store**: When recipient offline, sender pushes encrypted envelope to relay
2. **Forward**: Relay periodically attempts delivery or forwards to other relays
3. **Acknowledge**: Recipient sends ACK when message received
4. **Cleanup**: Relay deletes message after ACK or TTL expiry

### Configuration

Default relay config (adjustable per user):

```typescript
{
  enabled: true,          // Opt-in to be a relay
  maxStorage: 100,        // Max messages to store
  maxTTL: 86400,         // Max 24 hours
  maxHops: 5,            // Max relay hops
  forwardInterval: 30000 // Attempt forward every 30s
}
```

## Development

### Project Structure

```
src/
├── crypto/          # Cryptography (keys, encrypt, sign)
├── p2p/            # WebRTC and protocol
├── storage/        # IndexedDB persistence
├── relay/          # Store-and-forward relay
├── pages/          # App pages (Feed, Share, Scan, Chat)
├── components/     # React components
└── types/          # TypeScript type definitions
```

### Testing

```bash
# Run unit tests
npm test

# Run specific test file
npm test src/crypto/keys.test.ts
```

## Limitations & Next Steps

See [LIMITATIONS.md](LIMITATIONS.md) for details.

## Browser Compatibility

- Chrome/Edge 90+
- Firefox 88+
- Safari 15+

Requires:
- WebRTC support
- Web Crypto API
- IndexedDB
- ES2020+ JavaScript

## License

MIT

## Contributing

Contributions welcome! Please:
- Write tests for new features
- Follow existing code style
- Update documentation
- Test on multiple browsers
