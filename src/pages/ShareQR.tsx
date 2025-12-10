import { useState, useEffect } from 'react'
import type { Identity } from '@/storage/indexeddb'
import { importKeyPair, uint8ToBase64 } from '@/crypto/keys'
import { WebRTCPeer } from '@/p2p/webrtc'
import { createHandshakeData, generateHandshakeQR, generateConnectionString } from '@/p2p/qr'

interface ShareQRProps {
  identity: Identity
}

export default function ShareQR({ identity }: ShareQRProps) {
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [connectionString, setConnectionString] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [peer, setPeer] = useState<WebRTCPeer | null>(null)

  const generateQR = async () => {
    setLoading(true)
    try {
      // Import keys
      const keys = await importKeyPair(identity.keys)

      // Create WebRTC peer
      const webrtcPeer = new WebRTCPeer({
        onMessage: (data) => {
          console.log('Received message:', data)
        },
        onConnectionStateChange: (state) => {
          console.log('Connection state:', state)
        },
      })

      setPeer(webrtcPeer)

      // Create offer
      const offer = await webrtcPeer.createOffer()

      // Get ICE candidates (wait a bit for gathering)
      const iceCandidates = await webrtcPeer.getIceCandidates()

      // Create handshake data
      const handshakeData = createHandshakeData(
        identity.peerId,
        keys.publicEncKey,
        keys.publicSignKey,
        offer.sdp,
        iceCandidates
      )

      // Generate QR code
      const qrDataUrl = await generateHandshakeQR(handshakeData)
      setQrCode(qrDataUrl)

      // Generate connection string
      const connStr = generateConnectionString(handshakeData)
      setConnectionString(connStr)

      console.log('QR code generated successfully')
    } catch (error) {
      console.error('Failed to generate QR code:', error)
      alert('Failed to generate QR code. Check console for details.')
    } finally {
      setLoading(false)
    }
  }

  const copyConnectionString = () => {
    navigator.clipboard.writeText(connectionString)
    alert('Connection string copied to clipboard!')
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4">Share Connection</h2>
        <p className="text-gray-600 mb-6">
          Generate a QR code to share with friends. They can scan it to connect directly.
        </p>

        {!qrCode && (
          <button
            onClick={generateQR}
            disabled={loading}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold text-lg"
          >
            {loading ? 'Generating...' : 'Generate QR Code'}
          </button>
        )}

        {qrCode && (
          <div className="space-y-4">
            <div className="flex justify-center">
              <img src={qrCode} alt="Connection QR Code" className="max-w-full h-auto" />
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm font-semibold text-gray-700 mb-2">
                Or share this connection string:
              </p>
              <div className="bg-white border border-gray-300 rounded p-3 break-all text-xs font-mono mb-2">
                {connectionString}
              </div>
              <button
                onClick={copyConnectionString}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Copy Connection String
              </button>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Instructions:</strong>
                <br />
                1. Have your friend scan this QR code or paste the connection string
                <br />
                2. Wait for the connection to establish
                <br />
                3. You can now communicate peer-to-peer!
              </p>
            </div>

            <button
              onClick={() => {
                if (peer) {
                  peer.close()
                  setPeer(null)
                }
                setQrCode(null)
                setConnectionString('')
              }}
              className="w-full px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
            >
              Generate New QR Code
            </button>
          </div>
        )}
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
        </div>
      )}
    </div>
  )
}
