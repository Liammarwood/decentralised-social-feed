# GitHub Copilot Prompt

Create a **decentralized social media app** (like Instagram) using:
- **Next.js + React + MUI + TypeScript**
- **Progressive Web App (PWA)** features
- **Local-first, user-owned storage**
- **Decentralized sync (no central backend)**

## Requirements
1. Each user stores their data locally (IndexedDB or local decentralized DB).
2. Media (images/videos) stored on IPFS.
3. Metadata (posts, likes, follows) managed by:
   - Option 1: Gun.js (simplest)
   - Option 2: Y.js or Automerge with WebRTC sync
4. Each user controls their identity and encryption keys.
5. Offline-first experience with auto-sync when peers connect.
6. Feed, Profile, Upload, and Messaging pages.
7. MUI design for responsive layout.
8. PWA: service worker, manifest, offline caching.

## Deliverables
- `app/layout.tsx` with MUI theme provider and meta
- `app/page.tsx` = Feed (showing decentralized posts)
- `app/profile/page.tsx` = user-owned posts
- `app/upload/page.tsx` = image/video upload → IPFS
- `lib/db.ts` = local decentralized storage (Gun.js or Y.js)
- `lib/ipfs.ts` = IPFS helper for upload/retrieve
- `public/manifest.json` + `service-worker.ts`
- Fully functional installable PWA that works offline

## Goal
A decentralized, local-first, PWA-based social media app where users truly own and manage their own data.
