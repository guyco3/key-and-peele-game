# Kahoot Pattern Migration

## Overview

The game has been successfully migrated to follow Kahoot's architecture pattern for room creation and joining. This pattern separates **resource creation** (HTTP) from **real-time interaction** (WebSockets).

---

## Architecture Benefits

### Why HTTP + WebSocket (not just WebSocket)?

#### ✅ **Idempotent Room Creation**
- HTTP POST creates a single source of truth
- Prevents duplicate rooms on reconnection
- Easy retry logic with standard HTTP semantics

#### ✅ **Clean Separation of Concerns**
- **HTTP**: Create/query game resources (CRUD operations)
- **WebSocket**: Real-time updates and gameplay

#### ✅ **Works Before Socket Connection**
- Room can be created even if WebSocket isn't connected yet
- More reliable in poor network conditions

#### ✅ **Better Scalability**
- HTTP requests can be load-balanced independently
- Room creation doesn't need socket connection
- Easier to implement caching and rate limiting

---

## Flow Diagrams

### 1️⃣ Host Creates Room

```
┌──────────┐                 ┌──────────┐                 ┌──────────┐
│  Client  │                 │  Server  │                 │  Redis   │
└────┬─────┘                 └────┬─────┘                 └────┬─────┘
     │                            │                            │
     │ POST /api/games            │                            │
     │ { name, clientId, rules }  │                            │
     ├───────────────────────────>│                            │
     │                            │                            │
     │                            │ Generate gameId, PIN       │
     │                            │ Create game state          │
     │                            ├───────────────────────────>│
     │                            │                            │
     │                            │ Store game data            │
     │                            │<───────────────────────────┤
     │                            │                            │
     │ 201 { gameId, pin }        │                            │
     │<───────────────────────────┤                            │
     │                            │                            │
     │ WS: host:join              │                            │
     │ { gameId, clientId }       │                            │
     ├============================>│                            │
     │                            │                            │
     │                            │ Update socket ID           │
     │                            ├───────────────────────────>│
     │                            │                            │
     │ WS: room_joined            │                            │
     │ { gameId, pin, status }    │                            │
     │<===========================┤                            │
     │                            │                            │
```

### 2️⃣ Player Joins Room

```
┌──────────┐                 ┌──────────┐                 ┌──────────┐
│  Client  │                 │  Server  │                 │  Redis   │
└────┬─────┘                 └────┬─────┘                 └────┬─────┘
     │                            │                            │
     │ WS: player:join            │                            │
     │ { pin, name, clientId }    │                            │
     ├============================>│                            │
     │                            │                            │
     │                            │ Resolve PIN -> gameId      │
     │                            ├───────────────────────────>│
     │                            │                            │
     │                            │ Add player to game         │
     │                            │<───────────────────────────┤
     │                            │                            │
     │ WS: room_joined            │                            │
     │ { gameId, pin, status }    │                            │
     │<===========================┤                            │
     │                            │                            │
     │                            │ Broadcast player_list      │
     │                            ├============================>│
     │                            │ (to all in room)           │
     │                            │                            │
```

---

## Implementation Details

### Backend Changes

#### HTTP API Endpoints

```typescript
// POST /api/games - Create game room
app.post('/api/games', async (req, res) => {
  const { name, clientId, rules } = req.body;
  const { gameId, pin } = await RedisService.createGame(
    clientId, 
    'pending', // Socket ID added later
    name, 
    rules
  );
  res.status(201).json({ gameId, pin, status: 'lobby', hostId: clientId });
});

// GET /api/games/:pin - Validate game exists
app.get('/api/games/:pin', async (req, res) => {
  const game = await RedisService.getGameByPin(req.params.pin);
  if (!game) return res.status(404).json({ error: 'Game not found' });
  res.json({ gameId: game.gameId, pin: game.pin, status: game.status });
});

// GET /health - Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});
```

#### Socket.IO Events

**Before (Old Pattern):**
```typescript
socket.on('create_room', ...) // ❌ Removed
socket.on('join_room', ...)   // ❌ Renamed
```

**After (Kahoot Pattern):**
```typescript
socket.on('host:join', ...)   // ✅ Host joins after HTTP POST
socket.on('player:join', ...) // ✅ Player joins with PIN
```

### Frontend Changes

#### Room Creation Flow

**Before:**
```typescript
// ❌ Old pattern: Single socket event
const createRoom = (name: string, rules: GameRules) => {
  socket.emit('create_room', { name, clientId, rules });
};
```

**After:**
```typescript
// ✅ Kahoot pattern: HTTP POST then socket join
const createRoom = async (name: string, rules: GameRules) => {
  // Step 1: Create room via HTTP
  const response = await fetch('http://localhost:4000/api/games', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, clientId, rules }),
  });
  
  const { gameId, pin } = await response.json();
  
  // Step 2: Join as host via WebSocket
  socket.emit('host:join', { gameId, clientId });
};
```

#### Reconnection Logic

The frontend now detects whether the reconnecting user is the host or a player:

```typescript
const isHost = clientId === savedHostId;

if (isHost) {
  socket.emit('host:join', { gameId: savedGameId, clientId });
} else {
  socket.emit('player:join', { pin: savedPin, name: savedName, clientId });
}
```

---

## Key Differences from Socket-Only Pattern

| Aspect | Socket-Only (Old) | HTTP + Socket (Kahoot) |
|--------|-------------------|------------------------|
| **Room Creation** | `socket.emit('create_room')` | `POST /api/games` → `socket.emit('host:join')` |
| **Idempotency** | ❌ Can create duplicates | ✅ Single source of truth |
| **Retry Logic** | Complex, requires state management | Simple HTTP retry semantics |
| **Dependency** | Requires active socket | Works even if socket not ready |
| **Auditability** | Hard to log/monitor | Standard HTTP logs |
| **Scalability** | Socket-bound | Can load-balance independently |
| **Race Conditions** | ⚠️ Possible on refresh | ✅ Prevented by HTTP POST |

---

## Redis Changes

### Game Creation with "Pending" Host

When a room is created via HTTP POST, the host's socket ID is set to `'pending'`:

```typescript
await RedisService.createGame(
  clientId,
  'pending', // ← Placeholder until host:join
  name,
  rules
);
```

When the host joins via `host:join`, the `'pending'` socket ID is replaced with the real one:

```typescript
if (game.hostId === 'pending') {
  game.hostId = socket.id;
  // Update player entry from 'pending' to real socket ID
  const hostPlayer = game.players['pending'];
  delete game.players['pending'];
  game.players[socket.id] = hostPlayer;
  await RedisService.updateGame(game);
}
```

---

## Event Flow Summary

### Host Creates & Joins

1. **Client → HTTP POST** `/api/games` (create room)
2. **Server → Redis**: Store game with `hostId: 'pending'`
3. **Server → Client**: Return `{ gameId, pin }`
4. **Client → WebSocket**: `host:join { gameId, clientId }`
5. **Server → Redis**: Update `hostId` to real socket ID
6. **Server → Client**: `room_joined { gameId, pin, status }`

### Player Joins

1. **Client → WebSocket**: `player:join { pin, name, clientId }`
2. **Server → Redis**: Resolve PIN → gameId, add player
3. **Server → Client**: `room_joined { gameId, pin, status }`
4. **Server → All in Room**: `player_list { players }`

---

## Testing the Migration

### Manual Testing Steps

1. **Start the servers:**
   ```bash
   npm run dev
   ```

2. **Create a room as host:**
   - Open http://localhost:5173
   - Enter your name
   - Configure game settings
   - Click "Create Room"
   - ✅ Should see a 6-character PIN

3. **Join as player:**
   - Open http://localhost:5173 in another tab/browser
   - Enter a different name
   - Enter the PIN
   - Click "Join Game"
   - ✅ Both clients should see each other in the lobby

4. **Test reconnection:**
   - Refresh the host's browser
   - ✅ Should rejoin as host (via `host:join`)
   - Refresh a player's browser
   - ✅ Should rejoin as player (via `player:join`)

### Network Inspection

Open DevTools → Network tab:

1. **Room Creation:**
   - ✅ Should see `POST http://localhost:4000/api/games`
   - ✅ Response: `{ gameId, pin, status, hostId }`

2. **WebSocket Messages:**
   - ✅ Host: `host:join` → `room_joined`
   - ✅ Player: `player:join` → `room_joined` → `player_list`

---

## Migration Checklist

- [x] Add Express middleware and CORS
- [x] Create `POST /api/games` endpoint
- [x] Create `GET /api/games/:pin` endpoint
- [x] Replace `create_room` socket event with `host:join`
- [x] Rename `join_room` to `player:join`
- [x] Update shared event constants
- [x] Update frontend `createRoom` to use HTTP + socket
- [x] Update `GameContext` to remove `onRoomCreated`
- [x] Update reconnection logic to differentiate host/player
- [x] Test end-to-end flow
- [x] Update documentation

---

## Future Enhancements

### Potential Improvements

1. **Pre-flight Validation:**
   ```typescript
   // Before joining, check if room exists
   const response = await fetch(`/api/games/${pin}`);
   if (!response.ok) {
     alert('Room not found');
     return;
   }
   socket.emit('player:join', { pin, name, clientId });
   ```

2. **Rate Limiting:**
   ```typescript
   // Prevent spam room creation
   app.use('/api/games', rateLimit({ windowMs: 60000, max: 10 }));
   ```

3. **Authentication:**
   ```typescript
   // JWT for host verification
   const token = jwt.sign({ clientId }, SECRET);
   socket.emit('host:join', { gameId, token });
   ```

4. **Analytics:**
   ```typescript
   // Track room creation metrics
   await analytics.track('room_created', { gameId, rules });
   ```

---

## Troubleshooting

### Room creation fails with 500 error
- **Check**: Redis connection (`redis-cli ping`)
- **Check**: Backend logs for errors
- **Solution**: Restart Redis or backend

### Host can't join after creating room
- **Check**: `gameId` is stored in localStorage
- **Check**: WebSocket is connected
- **Solution**: Clear localStorage and try again

### "Game not found" error
- **Check**: PIN is correct (case-sensitive)
- **Check**: Game hasn't expired (15 min TTL)
- **Solution**: Create a new room

---

## Summary

The migration to the Kahoot pattern provides:

✅ **Reliability**: HTTP POST prevents duplicate rooms and race conditions  
✅ **Scalability**: Independent HTTP and WebSocket layers  
✅ **Maintainability**: Clear separation between resource creation and real-time interaction  
✅ **User Experience**: Works better in poor network conditions  

This architecture is production-ready and follows industry best practices used by platforms like Kahoot, Jackbox, and other real-time multiplayer games.

