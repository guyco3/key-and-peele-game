# Key & Peele Game - Setup Guide

## ✅ Implementation Complete!

All planned features have been successfully implemented:

### 🎯 Core Features Implemented

1. **Game PIN System (Like Kahoot)**
   - 6-character alphanumeric PINs
   - PIN → Game ID mapping in Redis
   - Easy-to-share PINs for joining games

2. **Redis Integration**
   - All game state stored in Redis
   - Automatic TTL cleanup (15 minutes)
   - Host disconnect tracking (2-minute timeout)
   - Efficient key-value structure

3. **Game Configuration**
   - Number of rounds (1-25)
   - Auto-progression toggle
   - Round length (5-60 seconds)
   - Round end screen length (5-60 seconds)
   - Manual sketch selection (with duplicates allowed)

4. **Score Hiding**
   - Scores hidden during rounds
   - Only latest guess counts per player
   - Score reveal animation on round end
   - Full leaderboard after each round

5. **Host Controls**
   - Manual skip buttons for auto-progression mode
   - Host disconnect handling with 2-minute grace period
   - Game ends if host doesn't return

6. **Reconnection Support**
   - Players can rejoin with same clientId
   - Scores preserved on reconnection
   - "You're back!" welcome message
   - State sync on reconnect

7. **Leave Game Button**
   - Always visible on all screens
   - Confirmation dialog
   - Proper cleanup on leave

8. **Beautiful UI**
   - Material-UI components
   - Kahoot-inspired color scheme
   - Responsive design
   - Smooth animations
   - Countdown timers
   - Score reveal effects

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- Redis (running on localhost:6379)

### Step 1: Start Redis

**Option A: Using Docker Compose (Recommended)**
```bash
docker-compose up -d
```

**Option B: Using Local Redis**
```bash
redis-server
```

Verify Redis is running:
```bash
redis-cli ping
# Should respond with: PONG
```

### Step 2: Install Dependencies

From the project root:
```bash
npm install
```

### Step 3: Start the Development Servers

```bash
npm run dev
```

This starts:
- Backend on `http://localhost:4000`
- Frontend on `http://localhost:5173` (or another port if 5173 is busy)

### Step 4: Open the Game

Navigate to `http://localhost:5173` in your browser.

---

## 🎮 How to Play

### Creating a Game

1. Enter your name
2. Configure game settings:
   - Number of rounds
   - Auto-progression (on/off)
   - Round length and round end screen length
   - Optionally select specific sketches
3. Click "Create Game"
4. Share the **6-character PIN** with friends

### Joining a Game

1. Enter your name
2. Enter the 6-character PIN
3. Click "Join Game"

### During a Round

- Listen to the audio clip
- Type your guess (autocomplete available)
- Submit your guess
- You can update your guess before the round ends
- **Scores are hidden until round end!**

### Host Controls

- **Auto-Progression Mode**: Rounds automatically advance
- **Manual Mode**: Host clicks "End Round" and "Next Round"
- **Skip Button**: Available in auto mode to skip timers

### Leaving a Game

- Click the red exit button (top-right corner)
- Confirm in the dialog
- Your data will be cleared

---

## 🏗️ Architecture Overview

### Backend (Node.js + Socket.IO + Redis)

**Redis Key Structure:**
```
pin:{PIN}                                    → gameId (TTL: 15min)
game:{gameId}                                → Game data (TTL: 15min)
game:{gameId}:round:{roundNum}:guesses       → Round guesses (TTL: 15min)
game:{gameId}:host:disconnected              → Host disconnect tracking (TTL: 2min)
```

**Socket Events:**
- `create_room` - Create new game
- `join_room` - Join via PIN
- `start_game` - Host starts game
- `submit_guess` - Player submits answer
- `skip_timer` - Host skips auto timer
- `leave_game` - Player leaves
- `sync_state` - Reconnection sync

**Auto-Progression:**
- Timers managed server-side
- Broadcasts timer updates every second
- Auto-advances when time expires
- Host can override with skip

**Host Disconnect Handling:**
- 2-minute grace period
- Game pauses for players
- If timeout: game ends, resources cleaned up
- If reconnect: game resumes

### Frontend (React + MUI)

**Screens:**
- `LandingScreen` - Create/join with full config
- `LobbyScreen` - PIN display, player list, waiting
- `RoundScreen` - Audio player, guess input, timer
- `RoundEndScreen` - Score reveal, leaderboard
- `GameOverScreen` - Final standings, winner announcement

**Components:**
- `CountdownTimer` - Circular progress timer
- `PlayerCard` - Styled player display
- `LeaveGameButton` - Confirmation dialog
- `HostDisconnectedModal` - Pause overlay
- `WelcomeBackSnackbar` - Reconnection message

**State Management:**
- React Context for global state
- localStorage for persistence
- Persistent clientId for reconnection

---

## 🔧 Configuration

### Redis Configuration

Currently hardcoded to `localhost:6379`. To change:

Edit `backend/src/services/redis.service.ts`:
```typescript
const redisClient = createClient({
  socket: {
    host: 'your-redis-host',
    port: 6379,
  },
});
```

### Backend Port

Currently running on port `4000`. To change:

Edit `backend/src/index.ts`:
```typescript
const PORT = 4000; // Change this
```

Also update frontend socket URL in `frontend/src/hooks/useSocket.ts`:
```typescript
socket = io("http://localhost:4000"); // Update port here
```

### TTL and Timeouts

Edit `backend/src/services/redis.service.ts`:
```typescript
const REDIS_TTL = 15 * 60; // 15 minutes
const HOST_DISCONNECT_TIMEOUT = 2 * 60; // 2 minutes
```

---

## 🐛 Troubleshooting

### Redis Connection Error

**Problem:** Backend fails to start with Redis connection error

**Solution:**
- Ensure Redis is running: `redis-cli ping`
- Check Redis port: `redis-cli -p 6379 ping`
- Start Redis: `redis-server` or `docker-compose up -d`

### Socket Connection Refused

**Problem:** Frontend can't connect to backend

**Solution:**
- Ensure backend is running: `npm run dev:backend`
- Check backend logs for errors
- Verify port 4000 is not in use

### PIN Not Working

**Problem:** Can't join game with PIN

**Solution:**
- Check PIN is exactly 6 characters
- Ensure game hasn't expired (15 min TTL)
- Check backend logs for errors
- Verify Redis has the key: `redis-cli GET pin:ABCD12`

### Host Disconnect Issues

**Problem:** Game ends immediately when host disconnects

**Solution:**
- Check `HOST_DISCONNECT_TIMEOUT` setting
- Ensure host has persistent clientId in localStorage
- Check Redis for disconnect tracking key

---

## 📝 Testing Checklist

- [ ] Create a game with default settings
- [ ] Create a game with custom settings
- [ ] Join a game with PIN
- [ ] Auto-progression works
- [ ] Manual progression works
- [ ] Skip timer works
- [ ] Submit guess (updates overwrite previous)
- [ ] Scores hidden during round
- [ ] Score reveal animation works
- [ ] Leave game works
- [ ] Host disconnect pauses game
- [ ] Host reconnect resumes game
- [ ] Host timeout ends game
- [ ] Player reconnection preserves score
- [ ] Multiple concurrent games work
- [ ] Game cleanup after 15 minutes

---

## 🎨 Customization

### Color Scheme

Edit `frontend/src/theme.ts` to customize colors:
```typescript
primary: {
  main: '#7B2CBF', // Purple
},
secondary: {
  main: '#FF006E', // Pink
},
```

### Sketch Database

Add more sketches in `shared/sketches.json`:
```json
{
  "id": "unique-id",
  "name": "Sketch Name",
  "youtubeId": "YouTube_Video_ID",
  "description": "Brief description",
  "tags": ["tag1", "tag2"]
}
```

---

## 🚢 Production Deployment

### Prerequisites

- DigitalOcean Droplet (or similar VPS)
- Domain name (optional)
- NGINX
- Redis
- Node.js
- PM2 (for process management)

### Steps

1. **Install dependencies on server**
```bash
apt update
apt install -y nodejs npm redis-server nginx
npm install -g pm2
```

2. **Clone and setup**
```bash
git clone <your-repo>
cd key-and-peele-game
npm install
cd frontend && npm run build
```

3. **Configure NGINX**
```nginx
server {
  listen 80;
  server_name yourdomain.com;

  location / {
    root /path/to/key-and-peele-game/frontend/dist;
    try_files $uri /index.html;
  }

  location /socket.io/ {
    proxy_pass http://localhost:4000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
  }
}
```

4. **Start backend with PM2**
```bash
cd backend
pm2 start npm --name "key-peele-backend" -- start
pm2 save
pm2 startup
```

5. **Enable Redis persistence**
```bash
redis-cli CONFIG SET save "900 1 300 10 60 10000"
```

---

## 📊 Monitoring

### Redis Keys

Check active games:
```bash
redis-cli KEYS "game:*"
```

Check PINs:
```bash
redis-cli KEYS "pin:*"
```

Get game data:
```bash
redis-cli GET game:{gameId}
```

### Backend Logs

With PM2:
```bash
pm2 logs key-peele-backend
```

---

## 🎉 You're All Set!

The game is fully functional with all the features you requested. Enjoy!

For issues or questions, check the troubleshooting section above.

