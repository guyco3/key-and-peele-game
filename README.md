# Key & Peele Guessing Game – Monorepo

This monorepo contains the full-stack implementation for the real-time YouTube audio snippet guessing game.

## Structure

- `backend/` – Node.js + Socket.IO server
- `frontend/` – React SPA client
- `shared/` – Shared TypeScript types and data

## Getting Started

1. **Install dependencies:**
    ```sh
    npm install
    ```
2. **Run in development:**
    ```sh
    npm run dev
    ```
    This starts both backend and frontend in watch mode.

3. **Build frontend for production:**
    ```sh
    cd frontend && npm run build
    ```

## Architecture & Design

### Current Architecture (MVP)
- **Frontend:** React SPA with Socket.IO client
- **Backend:** Node.js + Express + Socket.IO server
- **State:** In-memory storage
- **Communication:** Real-time WebSocket events

### Planned Architecture (Production)

🧱 **High-Level Architecture (Single Droplet)**

```
┌───────────────────────────────────────────────┐
│                  Client (Browser)              │
│                                               │
│  React SPA                                    │
│  - UI / Lobby / Rounds                        │
│  - YouTube iframe (audio only)                │
│  - Socket.IO client                           │
└───────────────────────────────────────────────┘
                     │
                     │  HTTP / WebSocket
                     ▼
┌───────────────────────────────────────────────┐
│                  NGINX                        │
│          (Edge / Reverse Proxy)               │
│                                               │
│  - Serves static files                        │
│  - Terminates TLS (HTTPS)                     │
│  - Proxies WebSockets                         │
│  - Caches static assets                       │
└───────────────────────────────────────────────┘
                     │
                     │  proxied HTTP / WS
                     ▼
┌───────────────────────────────────────────────┐
│              Node.js Game Server               │
│               (Socket.IO)                     │
│                                               │
│  - Room lifecycle                             │
│  - Guess validation                           │
│  - Scoring                                   │
│  - Emits real-time events                     │
│  - Authoritative game logic                   │
└───────────────────────────────────────────────┘
                     │
                     │  
                     ▼
┌───────────────────────────────────────────────┐
│                    Redis                      │
│             (In-memory Data Store)            │
│                                               │
│  - Room state                                 │
│  - Player scores                              │
│  - Current round                              │
│  - Fast ephemeral data                        │
└───────────────────────────────────────────────┘
```

🔑 **Component Responsibilities**

**1️⃣ NGINX — Edge / Gateway Layer**
- Serves static frontend files
- Acts as reverse proxy to Node.js
- Handles WebSocket upgrades
- Adds caching headers
- (Later) Handles HTTPS / SSL

**2️⃣ React Client — Presentation Layer**
- UI (lobby, round, scores)
- Audio playback (YouTube iframe)  
- Sends guesses via Socket.IO
- Renders server state
- Built once: `npm run build` → static files served by NGINX

**3️⃣ Node.js Server — Game Logic Layer**
- Room lifecycle management
- Player joins/leaves
- Round start/end logic
- Guess validation & scoring
- Socket.IO event broadcasting
- Authoritative & stateless per request

**4️⃣ Redis — State Store**
- Active rooms storage
- Player scores persistence
- Current round state
- Fast in-memory operations
- Shared state for future scaling

### 🔄 Data Flow

1. **Client loads app:** Browser → NGINX → React build files
2. **Client connects:** Browser → NGINX → Node.js (Socket.IO)
3. **State updates:** Node.js → Redis
4. **Broadcasts:** Node.js → NGINX → All Clients

### 🚀 Deployment Strategy

**Current (MVP):** Single machine with in-memory state
**Production:** Single DigitalOcean droplet ($6-12/month)
- NGINX for static files & reverse proxy
- Node.js for game logic
- Redis for persistent state
- PM2 for process management

**Future Scaling Options:**
- Multiple Node.js instances
- Managed Redis service
- Load balancer
- CDN for static assets

### 🔐 Security Boundaries

| Component | Exposed? | Notes |
|-----------|----------|-------|
| NGINX | ✅ Public | Only entry point |
| React | ✅ Public | Static files only |
| Node.js | ❌ Private | Behind NGINX |
| Redis | ❌ Private | localhost only |

---

# Key & Peele Game
Try to beat your friends on who the biggest Key & Peele fan is!
