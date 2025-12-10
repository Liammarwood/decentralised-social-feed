/**
 * WebRTC peer connection wrapper
 * Handles RTCPeerConnection setup, offer/answer exchange, ICE candidate handling,
 * and reliable data channel communication
 */

export interface WebRTCPeerConfig {
  onMessage: (data: any) => void
  onConnectionStateChange?: (state: RTCPeerConnectionState) => void
  onError?: (error: Error) => void
}

export class WebRTCPeer {
  private pc: RTCPeerConnection
  private dataChannel: RTCDataChannel | null = null
  private config: WebRTCPeerConfig
  private pendingCandidates: RTCIceCandidate[] = []

  constructor(config: WebRTCPeerConfig) {
    this.config = config

    // Initialize RTCPeerConnection with STUN server for NAT traversal
    this.pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    })

    // Setup connection state change handler
    this.pc.onconnectionstatechange = () => {
      console.log('Connection state:', this.pc.connectionState)
      if (this.config.onConnectionStateChange) {
        this.config.onConnectionStateChange(this.pc.connectionState)
      }
    }

    // Handle ICE connection state
    this.pc.oniceconnectionstatechange = () => {
      console.log('ICE connection state:', this.pc.iceConnectionState)
    }
  }

  /**
   * Create offer (initiator side)
   */
  async createOffer(): Promise<{ sdp: string; type: 'offer' }> {
    // Create reliable, ordered data channel
    this.dataChannel = this.pc.createDataChannel('data', {
      ordered: true,
      maxRetransmits: undefined, // Reliable mode
    })
    this.setupDataChannel(this.dataChannel)

    const offer = await this.pc.createOffer()
    await this.pc.setLocalDescription(offer)

    return {
      sdp: offer.sdp!,
      type: 'offer',
    }
  }

  /**
   * Create answer (receiver side)
   */
  async createAnswer(offer: { sdp: string; type: RTCSdpType }): Promise<{ sdp: string; type: 'answer' }> {
    await this.pc.setRemoteDescription(new RTCSessionDescription(offer))

    // Setup data channel when received
    this.pc.ondatachannel = (event) => {
      this.dataChannel = event.channel
      this.setupDataChannel(this.dataChannel)
    }

    const answer = await this.pc.createAnswer()
    await this.pc.setLocalDescription(answer)

    return {
      sdp: answer.sdp!,
      type: 'answer',
    }
  }

  /**
   * Set remote answer (initiator side)
   */
  async setAnswer(answer: { sdp: string; type: RTCSdpType }): Promise<void> {
    await this.pc.setRemoteDescription(new RTCSessionDescription(answer))

    // Add any pending ICE candidates
    for (const candidate of this.pendingCandidates) {
      await this.pc.addIceCandidate(candidate)
    }
    this.pendingCandidates = []
  }

  /**
   * Add ICE candidate
   */
  async addIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    if (this.pc.remoteDescription) {
      await this.pc.addIceCandidate(new RTCIceCandidate(candidate))
    } else {
      this.pendingCandidates.push(new RTCIceCandidate(candidate))
    }
  }

  /**
   * Get local ICE candidates
   */
  async getIceCandidates(): Promise<RTCIceCandidateInit[]> {
    return new Promise((resolve) => {
      const candidates: RTCIceCandidateInit[] = []

      this.pc.onicecandidate = (event) => {
        if (event.candidate) {
          candidates.push(event.candidate.toJSON())
        } else {
          // ICE gathering complete
          resolve(candidates)
        }
      }

      // Timeout after 5 seconds
      setTimeout(() => {
        resolve(candidates)
      }, 5000)
    })
  }

  /**
   * Setup data channel handlers
   */
  private setupDataChannel(channel: RTCDataChannel): void {
    channel.onopen = () => {
      console.log('Data channel opened')
    }

    channel.onclose = () => {
      console.log('Data channel closed')
    }

    channel.onerror = (error) => {
      console.error('Data channel error:', error)
      if (this.config.onError) {
        this.config.onError(new Error('Data channel error'))
      }
    }

    channel.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        this.config.onMessage(data)
      } catch (error) {
        console.error('Error parsing message:', error)
      }
    }
  }

  /**
   * Send JSON message over data channel
   */
  sendJson(data: any): void {
    if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
      console.warn('Data channel not ready')
      return
    }

    try {
      this.dataChannel.send(JSON.stringify(data))
    } catch (error) {
      console.error('Error sending message:', error)
      if (this.config.onError) {
        this.config.onError(error as Error)
      }
    }
  }

  /**
   * Check if connection is ready
   */
  isReady(): boolean {
    return this.dataChannel?.readyState === 'open'
  }

  /**
   * Close connection
   */
  close(): void {
    if (this.dataChannel) {
      this.dataChannel.close()
    }
    this.pc.close()
  }

  /**
   * Get connection state
   */
  getConnectionState(): RTCPeerConnectionState {
    return this.pc.connectionState
  }
}
