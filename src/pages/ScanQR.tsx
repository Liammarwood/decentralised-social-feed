import { useState } from 'react'
import type { Identity } from '@/storage/indexeddb'
import { importKeyPair, base64ToUint8 } from '@/crypto/keys'
import { WebRTCPeer } from '@/p2p/webrtc'
import { parseHandshakeQR, parseConnectionString } from '@/p2p/qr'
import { savePeer } from '@/storage/indexeddb'
import Camera from '@/components/Camera'

interface ScanQRProps {
  identity: Identity
}

export default function ScanQR({ identity }: ScanQRProps) {
  const [showCamera, setShowCamera] = useState(false)
  const [connectionString, setConnectionString] = useState('')
  const [peer, setPeer] = useState<WebRTCPeer | null>(null)
  const [connecting, setConnecting] = useState(false)

  const handleScan = (imageData: ImageData) => {
    const handshakeData = parseHandshakeQR(imageData)

    if (handshakeData) {
      console.log('QR code scanned successfully:', handshakeData)
      setShowCamera(false)
      connectToPeer(handshakeData)
    } else {
      console.log('No QR code found or invalid format')
    }
  }

  const handlePasteConnection = async () => {
    if (!connectionString.trim()) {
      alert('Please paste a connection string')
      return
    }

    const handshakeData = parseConnectionString(connectionString)

    if (handshakeData) {
      console.log('Connection string parsed successfully:', handshakeData)
      connectToPeer(handshakeData)
    } else {
      alert('Invalid connection string')
    }
  }

  const connectToPeer = async (handshakeData: any) => {
    setConnecting(true)
    try {
      // Import our keys
      await importKeyPair(identity.keys)

      // Import peer's public keys
      const peerEncKey = base64ToUint8(handshakeData.encKey)
      const peerSignKey = base64ToUint8(handshakeData.signKey)

      // Save peer to database
      await savePeer({
        id: handshakeData.id,
        publicSignKey: peerSignKey,
        publicEncKey: peerEncKey,
        lastSeen: Date.now(),
        isRelay: false,
      })

      // Create WebRTC peer
      const webrtcPeer = new WebRTCPeer({
        onMessage: (data) => {
          console.log('Received message:', data)
        },
        onConnectionStateChange: (state) => {
          console.log('Connection state:', state)
          if (state === 'connected') {
            alert('Successfully connected to peer!')
          } else if (state === 'failed' || state === 'disconnected') {
            alert('Connection failed or disconnected')
          }
        },
      })

      setPeer(webrtcPeer)

      // Add ICE candidates
      for (const candidate of handshakeData.ice) {
        await webrtcPeer.addIceCandidate(candidate)
      }

      // Create answer
      const answer = await webrtcPeer.createAnswer({
        sdp: handshakeData.sdp,
        type: 'offer',
      })

      console.log('Answer created:', answer)
      console.log('Connection in progress...')

      // In a real implementation, we would need to send the answer back to the peer
      // This would require a separate signaling mechanism or displaying the answer as QR/text

    } catch (error) {
      console.error('Failed to connect to peer:', error)
      alert('Failed to connect to peer. Check console for details.')
    } finally {
      setConnecting(false)
    }
  }

  return (
    <div className="space-y-6">
      {showCamera && (
        <Camera onCapture={handleScan} onClose={() => setShowCamera(false)} />
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4">Scan Connection</h2>
        <p className="text-gray-600 mb-6">
          Scan a friend's QR code to establish a peer-to-peer connection.
        </p>

        <button
          onClick={() => setShowCamera(true)}
          className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-lg mb-4"
        >
          Open Camera to Scan
        </button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or paste connection string</span>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <textarea
            className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-xs"
            placeholder="Paste connection string here (starts with p2p:...)"
            rows={4}
            value={connectionString}
            onChange={(e) => setConnectionString(e.target.value)}
          />
          <button
            onClick={handlePasteConnection}
            disabled={connecting || !connectionString.trim()}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {connecting ? 'Connecting...' : 'Connect'}
          </button>
        </div>
      </div>

      {peer && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-2">Connection Status</h3>
          <p className="text-sm text-gray-600">
            State: {peer.getConnectionState()}
          </p>
          <p className="text-sm text-gray-600">
            Ready: {peer.isReady() ? 'Yes' : 'No'}
          </p>

          <div className="mt-4">
            <h4 className="font-semibold mb-2">Test Connection</h4>
            <button
              onClick={() => {
                if (peer.isReady()) {
                  peer.sendJson({ type: 'PING', payload: {} })
                  alert('Ping sent!')
                } else {
                  alert('Connection not ready yet')
                }
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Send Test Message
            </button>
          </div>
        </div>
      )}

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          <strong>Note:</strong> This is a demo implementation. In a full implementation, the answer
          would need to be communicated back to the initiating peer through a separate channel or
          by displaying it as a QR code for them to scan.
        </p>
      </div>
    </div>
  )
}
