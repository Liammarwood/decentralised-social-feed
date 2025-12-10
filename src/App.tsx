import { useState, useEffect } from 'react'
import Feed from './components/Feed'
import ShareQR from './pages/ShareQR'
import ScanQR from './pages/ScanQR'
import Chat from './pages/Chat'
import { initDB, getIdentity, saveIdentity } from './storage/indexeddb'
import { generateIdentityKeys, exportKeyPair, generatePeerId } from './crypto/keys'
import type { Identity } from './storage/indexeddb'

type Page = 'feed' | 'share' | 'scan' | 'chat' | 'settings'

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('feed')
  const [identity, setIdentity] = useState<Identity | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    initializeApp()
  }, [])

  const initializeApp = async () => {
    try {
      await initDB()

      // Get or create identity
      let existingIdentity = await getIdentity()

      if (!existingIdentity) {
        console.log('Creating new identity...')
        const keys = await generateIdentityKeys()
        const peerId = generatePeerId()
        const exportedKeys = await exportKeyPair(keys)

        existingIdentity = {
          peerId,
          keys: exportedKeys,
          createdAt: Date.now(),
        }

        await saveIdentity(existingIdentity)
        console.log('Identity created:', peerId)
      } else {
        console.log('Identity loaded:', existingIdentity.peerId)
      }

      setIdentity(existingIdentity)
    } catch (error) {
      console.error('Failed to initialize app:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing...</p>
        </div>
      </div>
    )
  }

  if (!identity) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <p className="text-red-600">Failed to initialize identity</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-blue-600">P2P Social</h1>
            <div className="text-xs text-gray-500 truncate max-w-[200px]">
              ID: {identity.peerId.slice(0, 8)}...
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentPage === 'feed' && <Feed identity={identity} />}
        {currentPage === 'share' && <ShareQR identity={identity} />}
        {currentPage === 'scan' && <ScanQR identity={identity} />}
        {currentPage === 'chat' && <Chat identity={identity} />}
        {currentPage === 'settings' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Peer ID</label>
                <p className="mt-1 text-sm text-gray-900 break-all">{identity.peerId}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Created</label>
                <p className="mt-1 text-sm text-gray-900">
                  {new Date(identity.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-bottom">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-around py-3">
            <button
              onClick={() => setCurrentPage('feed')}
              className={`flex flex-col items-center space-y-1 ${
                currentPage === 'feed' ? 'text-blue-600' : 'text-gray-600'
              }`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2 2 0 00-2-2h-2"
                />
              </svg>
              <span className="text-xs">Feed</span>
            </button>

            <button
              onClick={() => setCurrentPage('share')}
              className={`flex flex-col items-center space-y-1 ${
                currentPage === 'share' ? 'text-blue-600' : 'text-gray-600'
              }`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <span className="text-xs">Share</span>
            </button>

            <button
              onClick={() => setCurrentPage('scan')}
              className={`flex flex-col items-center space-y-1 ${
                currentPage === 'scan' ? 'text-blue-600' : 'text-gray-600'
              }`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span className="text-xs">Scan</span>
            </button>

            <button
              onClick={() => setCurrentPage('chat')}
              className={`flex flex-col items-center space-y-1 ${
                currentPage === 'chat' ? 'text-blue-600' : 'text-gray-600'
              }`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <span className="text-xs">Chat</span>
            </button>

            <button
              onClick={() => setCurrentPage('settings')}
              className={`flex flex-col items-center space-y-1 ${
                currentPage === 'settings' ? 'text-blue-600' : 'text-gray-600'
              }`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span className="text-xs">Settings</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Bottom padding for fixed nav */}
      <div className="h-20"></div>
    </div>
  )
}

export default App
