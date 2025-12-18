# Recent Updates

## Update 1: Video Reveal on Round End Screen ✅

**Problem:** Round end screen only showed text of the correct answer, not the actual video.

**Solution:**
- Created new `VideoPlayer.tsx` component that displays the YouTube video (not hidden like AudioPlayer)
- Added VideoPlayer to RoundEndScreen above the timer
- Video auto-plays with same start/end times as the round
- Responsive design with 16:9 aspect ratio
- Shows video title below the player

**Files Modified:**
- `frontend/src/components/VideoPlayer.tsx` (NEW)
- `frontend/src/screens/RoundEndScreen.tsx`

---

## Update 2: Fixed Timer Card Flickering Bug ✅

**Problem:** Timer card on round screen kept disappearing and reappearing every second, creating a flickering effect.

**Root Cause:** 
- CountdownTimer component returned `null` when timerState was null/invalid
- Parent components conditionally rendered the Card wrapper
- When timer updates arrived every second, any brief null state caused the Card to unmount/remount
- This created a visible flicker

**Solution:**
1. **Made CountdownTimer stable** - Never returns null, always renders a Box with content
   - If timer is invalid/null, shows "Loading..." placeholder
   - Prevents component from unmounting during state updates
   - Added null checks and default values to prevent crashes

2. **Updated parent components** - Always render the Card wrapper
   - RoundScreen: Card always mounted, passes filtered timerState
   - RoundEndScreen: Card always mounted, passes filtered timerState
   - Prevents mount/unmount cycles

**Files Modified:**
- `frontend/src/components/CountdownTimer.tsx`
- `frontend/src/screens/RoundScreen.tsx`
- `frontend/src/screens/RoundEndScreen.tsx`

**Technical Details:**
```typescript
// Before (caused flickering):
{game.timerState && game.timerState.type === 'round' && (
  <Card>
    <CountdownTimer timerState={game.timerState} />
  </Card>
)}

// After (stable):
<Card>
  <CountdownTimer 
    timerState={game.timerState?.type === 'round' ? game.timerState : null} 
  />
</Card>

// CountdownTimer now handles null gracefully:
if (!timerState || timerState.type === null) {
  return <Box>Loading...</Box>; // Instead of null
}
```

---

## Testing Checklist

- [x] Video displays on round end screen
- [x] Video uses correct start/end times
- [x] Video auto-plays
- [x] Timer no longer flickers during rounds
- [x] Timer no longer flickers on round end screen
- [x] No linting errors
- [x] Responsive design maintained

---

## How to Test

1. Start a game with auto-progression
2. During a round, watch the timer - should NOT flicker
3. When round ends, video should appear showing the sketch
4. Video should auto-play with the same segment that was heard
5. Timer on round end screen should NOT flicker
6. Everything should be smooth and stable

---

## Performance Impact

- **Positive:** Eliminated mount/unmount cycles, reducing re-renders
- **No negative impact:** Video only loads on round end (not during round)
- **Stable:** Components stay mounted, improving user experience

---

## Update 3: Hide Timer When Auto-Progression is OFF ✅

**Problem:** Timer was always showing on round screens, even when auto-progression was disabled. When timer expired with auto-progression off, it showed "Loading..." which was confusing.

**Root Cause:**
- Frontend didn't store game rules (including `autoProgress` setting)
- Backend sent rules during game creation but frontend never saved them
- Timer always displayed regardless of game mode

**Solution:**
1. **Added gameRules to GameState**
   - Frontend now stores complete game rules in context
   - Backend sends rules in `state_snapshot` event
   - Rules include: autoProgress, roundLength, roundEndLength, rounds, selectedSketches

2. **Conditionally render timer**
   - RoundScreen: Only shows timer if `game.gameRules?.autoProgress === true`
   - RoundEndScreen: Only shows timer if `game.gameRules?.autoProgress === true`
   - When auto-progression is OFF, no timer is shown at all

**Files Modified:**
- `shared/index.ts` - Added gameRules to GameState interface
- `frontend/src/context/GameContext.tsx` - Store and manage gameRules state
- `backend/src/index.ts` - Send gameRules in state_snapshot
- `frontend/src/screens/RoundScreen.tsx` - Conditional timer rendering
- `frontend/src/screens/RoundEndScreen.tsx` - Conditional timer rendering

**User Experience:**
- **Auto-progression ON**: Timer shows as before, counts down, auto-advances
- **Auto-progression OFF**: No timer shown, host manually controls round progression
- No more confusing "Loading..." message when timer expires in manual mode

**Testing:**
- [x] Create game with auto-progression ON - timer shows and works
- [x] Create game with auto-progression OFF - no timer appears
- [x] Manual progression works without timer interference
- [x] State persists correctly on reconnection
- [x] No linting errors

---

## Update 4: Simplified Auto-Progression Backend Logic ✅

**Problem:** Backend had complex conditional logic for auto-progression vs manual mode, leading to two different code paths and potential bugs.

**Brilliant Simplification:**
Instead of having the backend check `if (autoProgress)` everywhere, we simplified it:

**Old Approach (Complex):**
```typescript
// Backend had two code paths:
if (game.rules.autoProgress) {
  startRoundTimer(gameId, game.rules.roundLength, callback);
}
// else: do nothing, host controls manually
```

**New Approach (Simple):**
```typescript
// Backend ALWAYS runs timers (one code path):
startRoundTimer(gameId, game.rules.roundLength, callback);

// Frontend sets timer values based on mode:
// - Auto mode: roundLength = 30s (user's choice)
// - Manual mode: roundLength = 900s (15 min = game expiry time)
```

**How It Works:**

1. **Frontend (LandingScreen):**
   - If `autoProgress = true`: Use user's chosen timer values (5-60s)
   - If `autoProgress = false`: Set timers to 900 seconds (15 minutes)
   - 900 seconds = same as game expiry/TTL time

2. **Backend:**
   - **ALWAYS** runs timers, no conditionals
   - **ALWAYS** calls `startRoundTimer()` and `startTimerBroadcast()`
   - Much simpler, cleaner code
   - Only one code path to test and maintain

3. **Frontend Display:**
   - Still only shows timer if `autoProgress = true`
   - Users in manual mode never see the 900-second countdown
   - From user perspective: no timer = manual control

**Benefits:**
- ✅ **Simpler backend** - Removed all `if (autoProgress)` checks
- ✅ **Fewer bugs** - One code path instead of two
- ✅ **Same UX** - 15-minute timer = effectively no auto-progression
- ✅ **Easier maintenance** - Less complexity, easier to understand
- ✅ **Natural timeout** - Games still expire after 15 minutes in manual mode

**Code Changes:**

**Frontend:**
```typescript
// LandingScreen.tsx
const rules: GameRules = {
  rounds: numRounds,
  autoProgress,
  roundLength: autoProgress ? roundLength : 900,      // Smart!
  roundEndLength: autoProgress ? roundEndLength : 900, // Simple!
  selectedSketches,
};
```

**Backend:**
```typescript
// index.ts - Always run timers (no more if statements!)
startRoundTimer(gameId, game.rules.roundLength, async () => {
  logger.info(`Auto-ending round for game ${gameId}`);
  await endRound(gameId, null);
});
```

**Files Modified:**
- `frontend/src/screens/LandingScreen.tsx`
- `backend/src/index.ts`

**Result:**
- Backend code is **simpler and more maintainable**
- Same user experience as before
- Less room for bugs
- Easier to understand and modify
- **No linting errors** ✅

