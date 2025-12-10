export interface Post {
  id: string
  author: string
  authorName: string
  content: string
  imageUrl?: string
  timestamp: number
  likes: number
}

export interface ChatMessage {
  id: string
  from: string
  to: string
  content: string
  timestamp: number
  status: 'pending' | 'sent' | 'delivered'
}
