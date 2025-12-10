import { useState, useEffect } from 'react'
import type { Post } from '@/types'
import type { Identity } from '@/storage/indexeddb'

interface FeedProps {
  identity: Identity
}

export default function Feed({ identity }: FeedProps) {
  const [posts, setPosts] = useState<Post[]>([])
  const [newPostContent, setNewPostContent] = useState('')

  useEffect(() => {
    // Load posts from local storage or sync
    loadPosts()
  }, [])

  const loadPosts = () => {
    // In a real implementation, this would load from Automerge CRDT
    const demoPost: Post[] = [
      {
        id: '1',
        author: identity.peerId,
        authorName: 'You',
        content: 'Welcome to the decentralized P2P social network! Connect with friends by scanning their QR codes.',
        timestamp: Date.now(),
        likes: 0,
      },
    ]
    setPosts(demoPost)
  }

  const handleCreatePost = () => {
    if (!newPostContent.trim()) return

    const newPost: Post = {
      id: Date.now().toString(),
      author: identity.peerId,
      authorName: 'You',
      content: newPostContent,
      timestamp: Date.now(),
      likes: 0,
    }

    setPosts([newPost, ...posts])
    setNewPostContent('')

    // In real implementation, sync to Automerge and propagate to peers
  }

  return (
    <div className="space-y-6">
      {/* Create Post */}
      <div className="bg-white rounded-lg shadow p-4">
        <textarea
          className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          placeholder="What's on your mind?"
          rows={3}
          value={newPostContent}
          onChange={(e) => setNewPostContent(e.target.value)}
        />
        <div className="mt-2 flex justify-end">
          <button
            onClick={handleCreatePost}
            disabled={!newPostContent.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Post
          </button>
        </div>
      </div>

      {/* Posts Feed */}
      <div className="space-y-4">
        {posts.map((post) => (
          <div key={post.id} className="bg-white rounded-lg shadow p-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                  {post.authorName[0].toUpperCase()}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-900">{post.authorName}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(post.timestamp).toLocaleDateString()}
                  </p>
                </div>
                <p className="text-xs text-gray-500 truncate">{post.author.slice(0, 16)}...</p>
                <p className="mt-2 text-gray-900 whitespace-pre-wrap">{post.content}</p>
                {post.imageUrl && (
                  <img
                    src={post.imageUrl}
                    alt="Post"
                    className="mt-3 rounded-lg max-w-full h-auto"
                  />
                )}
                <div className="mt-3 flex items-center space-x-4">
                  <button className="flex items-center space-x-1 text-gray-600 hover:text-blue-600">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      />
                    </svg>
                    <span className="text-sm">{post.likes}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {posts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No posts yet. Create one to get started!</p>
        </div>
      )}
    </div>
  )
}
