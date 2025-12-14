# Reconnection System (Kahoot-Style)

## Overview
The game now supports robust reconnection handling, similar to Kahoot. Players can refresh the page, lose connection, or close/reopen the browser and seamlessly rejoin their active game.

## How It Works

### Client-Side Persistence (localStorage)
When a player joins a room, the following data is stored in `localStorage`:
- `game_roomId` - The room they're in
- `game_name` - Their player name
- `game_status` - Current game phase (lobby, round, etc.)
- `game_hostId` - The host's socket ID

This data persists across:
- ✅ Page refreshes
- ✅ Browser close/reopen
- ✅ Network disconnections
- ✅ Tab close/reopen

### Automatic Reconnection Flow

```
1. User refreshes page or loses connection
   ↓
2. React app loads, reads localStorage
   ↓
3. GameContext initializes with saved state
   ↓
4. Socket connects
   ↓
5. useSocket detects saved roomId + name
   ↓
6. Emits join_room with saved credentials
   ↓
7. Backend recognizes same name → reconnection
   ↓
8. Backend preserves score, updates socket ID
   ↓
9. Emits sync_state to get current game state
   ↓
10. Client receives state_snapshot
    ↓
11. UI updates, player is back in game
```

## Backend Reconnection Logic

### Player Identity Matching
```typescript
// Check if name already exists in room
for (const [id, player] of Object.entries(room.players)) {
  if (player.name === name && id !== socket.id) {
    // This is a reconnection!
    // Preserve score, update socket ID
  }
}
```

### Score Preservation
When a reconnection is detected:
1. Player's score is preserved
2. Old socket ID is removed
3. New socket ID gets the player data
4. If player was host, host ID is updated

### Host Reconnection
Special handling for host:
```typescript
if (room.hostId === oldSocketId) {
  room.hostId = socket.id;
}
```
Host powers transfer to new socket ID seamlessly.

## Frontend Implementation

### LocalStorage Management
```typescript
// On room join/create
localStorage.setItem("game_roomId", roomId);
localStorage.setItem("game_name", name);
localStorage.setItem("game_status", status);

// On game over / leave
localStorage.removeItem("game_roomId");
localStorage.removeItem("game_name");
localStorage.removeItem("game_status");
```

### Socket Reconnect Handler
```typescript
s.on("connect", () => {
  const savedRoomId = localStorage.getItem("game_roomId");
  const savedName = localStorage.getItem("game_name");
  
  if (savedRoomId && savedName) {
    // Rejoin room
    s.emit("join_room", { roomId: savedRoomId, name: savedName });
    // Sync state
    s.emit("sync_state", { roomId: savedRoomId });
  }
});
```

## User Experience

### What Players See

**Before Reconnection:**
- Player is in middle of round 2
- Score: 150 points
- *Browser crashes*

**After Reconnection:**
- Page loads
- Automatically rejoins same room
- Still in round 2
- Score: 150 points (preserved!)
- Game continues seamlessly

### Edge Cases Handled

#### 1. Room No Longer Exists
```typescript
if (!room) {
  socket.emit("error_message", { message: "Room not found" });
  // Client clears localStorage and returns to landing
}
```

#### 2. Name Collision (Different Person)
- First person with that name in the room keeps it
- Second person gets an error
- Can join with different name

#### 3. Mid-Round Reconnection
- Player rejoins during active round
- Receives current video/state
- Can continue guessing
- Wrong guess count preserved

#### 4. Host Disconnection
- Host's socket ID updates
- Host powers transfer automatically
- Other players unaffected
- Host can still end round/advance game

## Testing Reconnection

### Test 1: Basic Refresh
1. Join a game
2. Note your score
3. Press F5 (refresh)
4. ✅ Should rejoin with same score

### Test 2: Close/Reopen Browser
1. Join a game
2. Close browser completely
3. Reopen browser
4. Navigate to game URL
5. ✅ Should auto-rejoin

### Test 3: Network Disconnection
1. Join a game
2. Disconnect WiFi
3. Reconnect WiFi
4. ✅ Should auto-reconnect

### Test 4: Mid-Round Reconnection
1. Start a game round
2. Submit some guesses
3. Refresh page
4. ✅ Should rejoin mid-round with score

### Test 5: Host Reconnection
1. Create room (you're host)
2. Start game
3. Refresh page
4. ✅ Should rejoin as host
5. ✅ "End Round" button should still work

## Comparison to Kahoot

| Feature | Kahoot | Our Implementation |
|---------|--------|-------------------|
| localStorage persistence | ✅ | ✅ |
| Automatic rejoin | ✅ | ✅ |
| Score preservation | ✅ | ✅ |
| State sync | ✅ | ✅ |
| Host reconnection | ✅ | ✅ |
| Name-based identity | ✅ | ✅ |
| Cookie fallback | ✅ | ❌ (not needed) |

## Security Considerations

### Why Name-Based Identity is Acceptable
1. **Casual Game**: Not handling sensitive data
2. **Room-Based**: Each room is isolated
3. **Temporary**: Rooms don't persist long-term
4. **No Auth Required**: Simpler UX for party game

### If You Need Stronger Security Later
Add authentication tokens:
```typescript
// Generate on first join
const clientToken = crypto.randomUUID();
localStorage.setItem("game_clientToken", clientToken);

// Send with reconnection
socket.emit("join_room", { 
  roomId, 
  name, 
  clientToken // Backend validates this
});
```

## Clearing Game Data

### Manual Leave
Players can click "Leave Game" button:
```typescript
game.clearGameData(); // Clears state + localStorage
```

### Automatic Cleanup
LocalStorage is cleared when:
- Player clicks "Leave Game"
- Game reaches "Game Over" (optional)
- Player creates/joins new room

### Manual Cleanup (Dev)
```javascript
// In browser console
localStorage.clear();
```

## Benefits

### For Players
- ✅ No frustration from accidental refresh
- ✅ Can recover from disconnects
- ✅ Mobile-friendly (handles background/foreground)
- ✅ Score never lost

### For Development
- ✅ Easy to test without rejoining manually
- ✅ Can refresh page during debugging
- ✅ Matches production behavior

### For Production
- ✅ Handles flaky mobile networks
- ✅ Graceful recovery from server restarts
- ✅ Better retention (fewer rage quits)
- ✅ Professional UX

## Future Enhancements

### Possible Improvements
1. Add session expiration (e.g., 1 hour)
2. Add "Resume Game" button on landing if session exists
3. Show "Reconnecting..." UI during reconnect
4. Add reconnection success toast notification
5. Track reconnection metrics

### Advanced: Cookie Fallback
If localStorage fails (private mode):
```typescript
// Use cookies as backup
document.cookie = `game_roomId=${roomId}; max-age=3600`;
```

## Debugging Reconnection

### Check localStorage
```javascript
// In browser console
console.log(localStorage.getItem("game_roomId"));
console.log(localStorage.getItem("game_name"));
console.log(localStorage.getItem("game_status"));
```

### Enable Socket Logs
Already enabled:
```typescript
s.on("connect", () => {
  console.log("Socket connected");
  console.log("Reconnecting to room:", savedRoomId);
});
```

### Backend Logs
```
SOCKET_EVENT: join_room by abc123 to room=ABCD as name=Player1
RECONNECTION: Player1 from xyz789 to abc123
```
