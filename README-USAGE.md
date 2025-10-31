# Decentralized Social Feed - Usage Guide

A fully functional decentralized, local-first social media PWA built with Next.js, React, MUI, TypeScript, Gun.js, and IPFS.

## 🚀 Quick Start

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm start
```

## 📱 Features

### ✅ Implemented

1. **Decentralized Storage** - Gun.js for local-first, peer-to-peer data storage
2. **User Authentication** - Signup/Login with encrypted credentials
3. **Post Creation** - Create posts with text content
4. **Media Upload** - Upload images and videos to IPFS (with fallback to local storage)
5. **Feed** - View all posts from the network
6. **Profile** - View your own posts
7. **PWA Support** - Installable as a Progressive Web App
8. **Offline-First** - Works without internet connection
9. **Material-UI Design** - Responsive, modern interface

### 🎯 Architecture

- **Frontend**: Next.js 16 with React and TypeScript
- **UI Framework**: Material-UI (MUI) v6
- **Decentralized DB**: Gun.js with SEA (encryption)
- **Media Storage**: IPFS (via public gateways and local fallback)
- **PWA**: next-pwa for service worker and manifest

## 📖 User Guide

### Creating an Account

1. Click "Login" in the navigation bar
2. Switch to "Sign Up" tab
3. Enter a unique username and password (min 8 characters)
4. Click "Sign Up"

### Creating a Post

1. Log in to your account
2. Click the "+" icon in the navigation bar
3. Enter your post content
4. (Optional) Upload an image or video
5. Click "Post"

### Viewing Posts

- **Feed**: Click the home icon to see all posts
- **Profile**: Click the person icon to see only your posts

### Logging Out

Click the account icon in the navigation bar and select "Logout"

## 🔧 Technical Details

### File Structure

```
├── app/
│   ├── layout.tsx         # Root layout with MUI theme
│   ├── page.tsx           # Feed page
│   ├── auth/page.tsx      # Login/Signup page
│   ├── profile/page.tsx   # User profile page
│   └── upload/page.tsx    # Post creation page
├── components/
│   ├── Navigation.tsx     # App navigation bar
│   └── ThemeRegistry.tsx  # MUI theme provider
├── lib/
│   ├── db.ts              # Gun.js database layer
│   ├── ipfs.ts            # IPFS helpers
│   └── theme.tsx          # MUI theme configuration
├── public/
│   ├── manifest.json      # PWA manifest
│   ├── icon-192.png       # App icon
│   └── icon-512.png       # App icon
└── next.config.mjs        # Next.js + PWA configuration
```

### Data Storage

- **Gun.js**: Stores user credentials, posts metadata, and social graph
- **Local Storage**: Gun.js uses browser localStorage for persistence
- **IPFS**: Media files are uploaded to IPFS (with local fallback for demo)

### Decentralization

The app is truly decentralized:
- No central server required
- Data stored locally in browser
- P2P synchronization via Gun.js relay peers
- IPFS for distributed media storage

### PWA Features

- Installable on desktop and mobile
- Offline caching via service worker
- App-like experience
- Web Share API support

## 🐛 Known Limitations

1. **Session Persistence**: Authentication state may require re-login after page refresh (Gun.js session restoration can be improved)
2. **Relay Peers**: Public Gun.js relay servers are often down, but the app works fully locally
3. **IPFS Upload**: Falls back to local storage when public IPFS gateways are unavailable

## 🔒 Security

- User passwords are encrypted using Gun's SEA (Security, Encryption, Authorization)
- All user data is cryptographically signed
- Private keys never leave the browser

## 🌐 Browser Support

- Chrome/Edge (recommended)
- Firefox
- Safari
- Any modern browser with localStorage and service worker support

## 📦 Dependencies

- next@16.0.1
- react@19
- @mui/material@6+
- gun@0.2020
- next-pwa@5+

## 🤝 Contributing

This is a demonstration project showing decentralized architecture patterns. Feel free to extend it with:
- Direct messaging
- Following/followers system
- Content moderation
- Better IPFS integration
- Additional media types

## 📄 License

MIT License - feel free to use this code for your own projects!
