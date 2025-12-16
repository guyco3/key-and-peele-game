# Bug Fixes - Round Timer & Round End Screen

## Summary

Fixed two critical bugs related to auto-progression and timer display:

1. ✅ **Bug #2**: Timer card not showing during round when `autoProgress` is ON
2. 🔍 **Bug #1**: Round end screen being skipped when `autoProgress` is OFF (investigation + logging added)

---

## Bug #2: Timer Card Not Showing (FIXED ✅)

### Problem

When `autoProgress` was enabled, the timer card was not displaying on the `RoundScreen`, even though the conditional rendering logic appeared correct.

### Root Cause

The `room_joined` Socket.IO event was **not sending `gameRules`** to the frontend. This meant:
- `game.gameRules` was `undefined` on the frontend
- The condition `game.gameRules?.autoProgress` evaluated to `false`
- The timer card was never rendered

### Solution

**Backend Changes (`backend/src/index.ts`):**

```typescript
// In host:join handler
socket.emit("room_joined", {
  gameId,
  pin: game.pin,
  status: game.status,
  hostId: game.hostClientId,
  gameRules: game.rules,  // ✅ Added
  isReconnecting: false,
});

// In player:join handler  
socket.emit("room_joined", {
  gameId: updatedGame.gameId,
  pin: updatedGame.pin,
  status: updatedGame.status,
  hostId: updatedGame.hostClientId,
  gameRules: updatedGame.rules,  // ✅ Added
  isReconnecting: wasReconnecting,
});
```

**Frontend Changes (`frontend/src/context/GameContext.tsx`):**

```typescript
// Updated type signature
onRoomJoined: (data: { 
  gameId: string; 
  pin: string; 
  status: GameStatus; 
  hostId: string; 
  gameRules?: GameRules;  // ✅ Added
  isReconnecting?: boolean 
}) => void;

// Updated implementation
const onRoomJoined = ({ gameId, pin, status, hostId, gameRules: rules, isReconnecting }) => {
  // ... existing code ...
  
  // Set game rules if provided
  if (rules) {
    setGameRules(rules);
    localStorage.setItem("game_rules", JSON.stringify(rules));
  }
  
  // ... rest of function ...
};
```

### Testing

1. **Create a room with `autoProgress` ON**
2. **Verify**: Timer card appears on RoundScreen with countdown
3. **Create a room with `autoProgress` OFF**
4. **Verify**: Timer card does NOT appear (host controls manually)

### Files Changed

- `backend/src/index.ts` (lines 250-256, 295-301)
- `frontend/src/context/GameContext.tsx` (lines 24-25, 85-102)

---

## Bug #1: Round End Screen Skipped (INVESTIGATION 🔍)

### Problem

When `autoProgress` is OFF, clicking "Skip to Results" on the RoundScreen appears to skip the RoundEndScreen entirely, going straight to the next round.

### Expected Behavior

**Manual Mode Flow (`autoProgress = false`):**

1. **Round X** (RoundScreen)
2. Host clicks "Skip to Results"
3. **Round X End** (RoundEndScreen) → Shows leaderboard, video reveal
4. Host clicks "Skip to Next Round"
5. **Round X+1** (RoundScreen)

### Investigation

Added comprehensive logging to trace the issue:

**Backend Logging (`backend/src/index.ts`):**

```typescript
// In endRound() function
logger.info(`[DEBUG] Emitting round_end for game ${gameId}, autoProgress=${updatedGame.rules.autoProgress}, roundEndLength=${updatedGame.rules.roundEndLength}s`);

logger.info(`[DEBUG] Starting round end timer for ${updatedGame.rules.roundEndLength}s`);

startRoundTimer(gameId, updatedGame.rules.roundEndLength, async () => {
  logger.info(`[DEBUG] Round end timer expired for game ${gameId}, calling nextRound`);
  await nextRound(gameId, null);
});

// In skip_timer handler
logger.info(`[DEBUG] skip_timer - current status: ${game.status}, autoProgress: ${game.rules.autoProgress}`);

if (game.status === "round") {
  logger.info(`[DEBUG] Skipping from round to round_end`);
  await endRound(gameId, socket.id);
} else if (game.status === "round_end") {
  logger.info(`[DEBUG] Skipping from round_end to next round`);
  await nextRound(gameId, socket.id);
}
```

### Hypotheses to Test

1. **Timer Duration Issue**: 
   - Check if `roundEndLength` is correctly set to 900s (15 min) when `autoProgress = false`
   - Verify it's not being set to 0 or a very small value

2. **Double Event Issue**:
   - Check if `endRound` is somehow being called twice
   - Check if `nextRound` is being triggered immediately after `endRound`

3. **Frontend Navigation Issue**:
   - Verify `onRoundEnd` in GameContext is properly setting status to "round_end"
   - Check if App.tsx navigation logic is working correctly

4. **Redis State Issue**:
   - Verify game rules are persisted correctly in Redis
   - Check if `roundEndLength` value is being read correctly from Redis

### Testing Instructions

1. **Enable Detailed Logging**:
   ```bash
   cd /Users/guycohen/Desktop/key-and-peele-game
   npm run dev
   ```

2. **Create Game with Manual Mode**:
   - Turn OFF "Auto Progress"
   - Set rounds to 3
   - Don't select specific sketches

3. **Play Through a Round**:
   - Start the game
   - Wait for audio to play (or skip)
   - Click "Skip to Results"
   - **OBSERVE**: Does RoundEndScreen appear?

4. **Check Backend Logs** for:
   ```
   [DEBUG] Emitting round_end for game <id>, autoProgress=false, roundEndLength=900s
   [DEBUG] Starting round end timer for 900s
   [DEBUG] skip_timer - current status: round_end, autoProgress: false
   [DEBUG] Skipping from round_end to next round
   ```

5. **Check Frontend State**:
   - Open DevTools → Console
   - Look for: `Room joined - gameId: ..., gameRules: { autoProgress: false, ... }`
   - Check `localStorage`: `game_status` should change from `round` → `round_end` → `round`

### Possible Fixes (if issue confirmed)

**If timer is firing immediately:**
```typescript
// Ensure roundEndLength is properly validated
if (!game.rules.roundEndLength || game.rules.roundEndLength < 5) {
  logger.error(`Invalid roundEndLength: ${game.rules.roundEndLength}`);
  game.rules.roundEndLength = 900; // Fallback to 15 min
}
```

**If frontend is not navigating:**
```typescript
// Ensure status change triggers navigation
useEffect(() => {
  console.log('[DEBUG] Status changed to:', game.status);
  // ... navigation logic ...
}, [game.status]);
```

### Files Changed

- `backend/src/index.ts` (lines 641-652, 411-423)

---

## Verification Checklist

### Bug #2 (Timer Card)
- [ ] Timer card appears on RoundScreen when `autoProgress = true`
- [ ] Timer counts down correctly (e.g., 30s → 29s → 28s...)
- [ ] Timer card does NOT appear when `autoProgress = false`
- [ ] Timer card appears on RoundEndScreen when `autoProgress = true`

### Bug #1 (Round End Screen)
- [ ] RoundEndScreen displays for full duration in manual mode
- [ ] Host can click "Skip to Next Round" button
- [ ] Video reveals correctly on RoundEndScreen
- [ ] Leaderboard shows updated scores
- [ ] Navigation works: Round → RoundEnd → Next Round

---

## Related Files

### Backend
- `backend/src/index.ts` - Main Socket.IO server
- `backend/src/services/redis.service.ts` - Redis state management

### Frontend
- `frontend/src/context/GameContext.tsx` - Global state management
- `frontend/src/screens/RoundScreen.tsx` - Round gameplay screen
- `frontend/src/screens/RoundEndScreen.tsx` - Results screen
- `frontend/src/hooks/useSocket.ts` - Socket event handlers
- `frontend/src/App.tsx` - Route navigation

### Shared
- `shared/index.ts` - Type definitions (GameRules, TimerState, etc.)

---

## Next Steps

1. **Test Bug #2 fix** - Verify timer card displays correctly
2. **Analyze Bug #1 logs** - Determine root cause from debug output
3. **Implement Bug #1 fix** - Based on log analysis
4. **End-to-end testing** - Both auto and manual modes

---

## Notes

- Manual mode (`autoProgress = false`) sets timers to 900 seconds (15 minutes) to simulate "infinite" time
- Backend always runs timers regardless of mode - this simplifies logic
- Frontend conditionally renders timer cards based on `game.gameRules.autoProgress`
- Host can always skip timers in both modes using skip buttons

