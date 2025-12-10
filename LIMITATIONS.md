# Limitations and Future Work

## Current Limitations

### 1. Signaling

**Issue**: Initial WebRTC handshake requires out-of-band signaling.

**Current State**:
- QR code scanning (requires camera)
- Copy/paste connection strings
- No automatic peer discovery

**Impact**:
- Manual connection setup
- Not suitable for large-scale networks
- Requires physical proximity or secondary channel

**Future Solutions**:
- Implement DHT for peer discovery
- Add signaling server (optional, for convenience)
- Bootstrap nodes for initial peer discovery
- Friend-of-friend discovery protocol

### 2. NAT Traversal

**Issue**: WebRTC connections may fail behind restrictive NATs.

**Current State**:
- STUN server only (stun.l.google.com)
- No TURN server support
- May fail on symmetric NATs

**Impact**:
- ~10-20% of users unable to connect
- Corporate/restrictive networks problematic
- No fallback mechanism

**Future Solutions**:
- Add TURN server support (configured via env var)
- Implement TURN credential service
- Add relay-only mode for extreme NAT cases
- Consider libp2p for better NAT handling

### 3. Relay Discovery

**Issue**: No automatic relay discovery mechanism.

**Current State**:
- Users must manually opt-in as relay
- No relay directory service
- No relay quality metrics

**Impact**:
- Limited relay availability
- No way to find reliable relays
- Poor user experience for offline messaging

**Future Solutions**:
- Implement relay directory (DHT-based)
- Add relay reputation system
- Relay availability discovery
- Payment/incentive layer for relays

### 4. Feed Synchronization

**Issue**: CRDT feed synchronization not fully implemented.

**Current State**:
- Automerge included but not integrated
- Posts only stored locally
- No multi-peer feed merging

**Impact**:
- No shared feed across peers
- Can't see friends' posts
- Limited social functionality

**Future Solutions**:
- Complete Automerge integration
- Implement feed sync protocol
- Add conflict resolution
- Optimize for large feeds

### 5. Mobile Camera Access

**Issue**: Camera access requires HTTPS.

**Current State**:
- Works on localhost (development)
- Requires HTTPS in production
- Self-signed certs don't work

**Impact**:
- QR scanning doesn't work on HTTP
- Forces copy/paste workflow
- Poor mobile UX

**Future Solutions**:
- Deploy with HTTPS (Let's Encrypt)
- Document HTTPS setup
- Add PWA installation guide
- Consider WebUSB for QR scanner hardware

### 6. WebRTC Answer Exchange

**Issue**: Responder's answer not sent back to initiator.

**Current State**:
- Initiator creates offer → QR code
- Responder creates answer → not communicated
- Connection incomplete

**Impact**:
- Demo only shows half-connection
- Requires additional signaling round
- Not truly peer-to-peer yet

**Future Solutions**:
- Implement answer QR code generation
- Add answer relay through existing peers
- Use signaling server as temporary solution
- Implement simultaneous open (both create offers)

### 7. Message Persistence

**Issue**: Messages only in IndexedDB, no backup.

**Current State**:
- Local-only storage
- No cloud backup
- No export functionality

**Impact**:
- Data loss if device lost
- Can't move to new device
- No multi-device support

**Future Solutions**:
- Optional encrypted cloud backup
- Export/import functionality
- Multi-device sync via relay
- Encrypted backup to IPFS

### 8. Key Management

**Issue**: No key rotation or revocation.

**Current State**:
- Static identity keys
- No expiration dates
- No revocation mechanism

**Impact**:
- Compromised keys can't be revoked
- No forward secrecy
- Long-term identity compromise risk

**Future Solutions**:
- Implement key rotation protocol
- Add signed key revocation lists
- Ephemeral session keys
- Double Ratchet for forward secrecy

### 9. Performance

**Issue**: Not optimized for scale.

**Current State**:
- No message pagination
- Loads all messages in memory
- No indexing strategy

**Impact**:
- Slow with many messages
- High memory usage
- Poor performance on mobile

**Future Solutions**:
- Implement virtual scrolling
- Message pagination
- IndexedDB query optimization
- Background sync with Web Workers

### 10. Testing

**Issue**: Limited test coverage.

**Current State**:
- No unit tests yet
- No integration tests
- Manual testing only

**Impact**:
- Bugs may slip through
- Refactoring risky
- Hard to maintain

**Future Solutions**:
- Add Vitest unit tests
- E2E tests with Playwright
- WebRTC mocking for tests
- CI/CD pipeline

## Browser Compatibility Issues

### Safari

**Issues**:
- Ed25519 not supported yet (using ECDH P-256 instead)
- IndexedDB quota limits
- Background tab throttling

**Workarounds**:
- Use P-256 curve for key agreement
- Request persistent storage
- Keep app in foreground

### Firefox

**Issues**:
- Stricter CSP requirements
- Different WebRTC implementation details

**Workarounds**:
- Adjust CSP headers
- Test WebRTC thoroughly
- Use adapter.js shim

### Mobile Browsers

**Issues**:
- Limited background processing
- Strict battery optimization
- Smaller storage quotas

**Workarounds**:
- PWA installation
- Persistent storage request
- Optimize battery usage

## Security Limitations

### 1. Metadata Leaks

**Issue**: Relays see sender, recipient, timing.

**Mitigation**: Implement onion routing or mixnets.

### 2. Sybil Attacks

**Issue**: No identity verification.

**Mitigation**: Web of trust, reputation system.

### 3. Spam/DoS

**Issue**: No rate limiting on relay storage.

**Mitigation**: Implement storage quotas, proof-of-work.

### 4. Malicious Relays

**Issue**: Relays could drop messages.

**Mitigation**: Multi-relay redundancy, reputation tracking.

## Scalability Concerns

### Network Size

- **Current**: 10-100 peers
- **Target**: 1000+ peers
- **Bottleneck**: Full mesh topology

**Solution**: Implement partial mesh with routing.

### Message Volume

- **Current**: 100s of messages
- **Target**: 10,000+ messages
- **Bottleneck**: Loading all in memory

**Solution**: Pagination and lazy loading.

### Relay Load

- **Current**: Single relay handles 100 messages
- **Target**: Multiple relays, thousands of messages
- **Bottleneck**: No load balancing

**Solution**: DHT-based relay selection.

## Production Readiness Checklist

- [ ] Add TURN server support
- [ ] Implement DHT for discovery
- [ ] Complete feed synchronization
- [ ] Add service worker for offline
- [ ] Implement key rotation
- [ ] Add message pagination
- [ ] Write comprehensive tests
- [ ] Optimize for mobile
- [ ] Add analytics/telemetry
- [ ] Create deployment guide
- [ ] Security audit
- [ ] Performance benchmarks
- [ ] Cross-browser testing
- [ ] Accessibility audit
- [ ] Documentation polish

## Research Questions

1. **Incentive Mechanisms**: How to incentivize relay operators?
2. **Privacy**: Can we prevent metadata analysis?
3. **Scaling**: What's the maximum network size?
4. **Consensus**: Do we need consensus for feed ordering?
5. **Spam Prevention**: How to prevent spam without centralization?

## Migration Path

### Phase 1: MVP (Current)
- Basic P2P connections
- QR code handshake
- Simple messaging

### Phase 2: Enhanced Connectivity
- TURN server support
- Better NAT traversal
- Relay directory

### Phase 3: Social Features
- Complete feed sync
- Friend discovery
- Group messaging

### Phase 4: Production Ready
- Security hardening
- Performance optimization
- Mobile app (React Native)

### Phase 5: Advanced Features
- libp2p migration
- Onion routing
- Incentive layer

## Contributing

If you'd like to help address these limitations:

1. Pick an issue from the list
2. Open a GitHub issue to discuss approach
3. Submit a PR with tests
4. Update documentation

Priority areas:
- NAT traversal improvements
- Test coverage
- Mobile optimization
- Feed synchronization

## Conclusion

This project is a proof-of-concept demonstrating decentralized P2P social networking with end-to-end encryption. While functional for demos and small networks, significant work remains for production deployment. The architecture is designed to be extensible, and contributions are welcome!
