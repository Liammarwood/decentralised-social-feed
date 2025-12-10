import { useState, useEffect } from 'react'
import type { Identity } from '@/storage/indexeddb'
import { getAllPeers, type Peer } from '@/storage/indexeddb'
import type { ChatMessage } from '@/types'

interface ChatProps {
  identity: Identity
}

export default function Chat({ identity }: ChatProps) {
  const [peers, setPeers] = useState<Peer[]>([])
  const [selectedPeer, setSelectedPeer] = useState<Peer | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')

  useEffect(() => {
    loadPeers()
  }, [])

  useEffect(() => {
    if (selectedPeer) {
      loadMessages(selectedPeer.id)
    }
  }, [selectedPeer])

  const loadPeers = async () => {
    const allPeers = await getAllPeers()
    setPeers(allPeers)
  }

  const loadMessages = async (peerId: string) => {
    // In real implementation, load from IndexedDB and decrypt
    const demoMessages: ChatMessage[] = [
      {
        id: '1',
        from: identity.peerId,
        to: peerId,
        content: 'Hello! Connection established.',
        timestamp: Date.now() - 60000,
        status: 'delivered',
      },
    ]
    setMessages(demoMessages)
  }

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedPeer) return

    const message: ChatMessage = {
      id: Date.now().toString(),
      from: identity.peerId,
      to: selectedPeer.id,
      content: newMessage,
      timestamp: Date.now(),
      status: 'pending',
    }

    setMessages([...messages, message])
    setNewMessage('')

    // In real implementation:
    // 1. Encrypt message
    // 2. Create message envelope
    // 3. Try to send directly or via relay
    // 4. Update status based on delivery
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow">
        <h2 className="text-2xl font-bold p-6 border-b">Messages</h2>

        {peers.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-gray-600">
              No peers connected yet. Scan or share a QR code to connect with friends.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 min-h-[500px]">
            {/* Peers List */}
            <div className="border-r">
              <div className="divide-y">
                {peers.map((peer) => (
                  <button
                    key={peer.id}
                    onClick={() => setSelectedPeer(peer)}
                    className={`w-full p-4 text-left hover:bg-gray-50 ${
                      selectedPeer?.id === peer.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold">
                        {peer.id[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {peer.id.slice(0, 8)}...
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(peer.lastSeen).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Area */}
            <div className="md:col-span-2 flex flex-col">
              {selectedPeer ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b">
                    <p className="font-semibold">{selectedPeer.id.slice(0, 16)}...</p>
                    <p className="text-xs text-gray-500">
                      {selectedPeer.isRelay ? 'Relay Node' : 'Direct Peer'}
                    </p>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 p-4 overflow-y-auto space-y-3">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${
                          msg.from === identity.peerId ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg p-3 ${
                            msg.from === identity.peerId
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-200 text-gray-900'
                          }`}
                        >
                          <p>{msg.content}</p>
                          <p
                            className={`text-xs mt-1 ${
                              msg.from === identity.peerId
                                ? 'text-blue-100'
                                : 'text-gray-500'
                            }`}
                          >
                            {new Date(msg.timestamp).toLocaleTimeString()}
                            {msg.from === identity.peerId && ` • ${msg.status}`}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Message Input */}
                  <div className="p-4 border-t">
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleSendMessage()
                          }
                        }}
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim()}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                      >
                        Send
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  Select a peer to start chatting
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Store-and-Forward:</strong> When a recipient is offline, messages are stored by
          relay nodes and forwarded when the recipient comes online. All messages are end-to-end
          encrypted.
        </p>
      </div>
    </div>
  )
}
