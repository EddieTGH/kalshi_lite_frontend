# Betting Data Caching Strategy

## Overview

This document describes the caching strategy implemented for the "Your Bets" and "Browse Bets" tabs in the dashboard. The goal is to provide instant tab switching without loading spinners while keeping data fresh through background updates.

## Problem Statement

**Before caching:**
- Switching between tabs showed a "Loading..." spinner every time
- Users had to wait for data to refetch even if they just viewed it seconds ago
- This created a poor user experience and unnecessary API calls

**After caching:**
- Tabs display cached data immediately when switching (no loading spinner)
- Data stays fresh through background refreshing every 30 seconds
- User actions (placing bets, etc.) trigger silent updates that don't disrupt the UI

## Architecture

### 1. BetsCache Context Provider (`/lib/bets-cache-context.tsx`)

The caching system is built using React Context, which is the industry-standard approach for sharing state across components without prop drilling.

**Key Components:**

```typescript
interface BetsCache {
  bets: BetWithPlacement[];       // All bets in the party
  partyMembers: PartyMember[];     // All members in the party
  availableMoney: number;          // Current user's available money
  betsLocked: boolean;             // Whether betting is locked
  lastFetched: number | null;      // Timestamp of last fetch
}
```

**Why Single Cache?**
- **Single source of truth**: One cache holds ALL data for all tabs
- **Simpler architecture**: Less code, easier to maintain
- **More efficient**: One set of API calls instead of multiple
- **Clean separation**: Cache stores raw data, components handle filtering/presentation
- Example: YourBetsTab filters `bets.filter(b => b.user_placement.has_placed)`
- Example: BrowseBetsTab filters `bets.filter(b => !b.user_placement.has_placed)`

### 2. Cache Lifecycle

#### Initial Load
```
User navigates to dashboard
    ↓
BetsCacheProvider mounts
    ↓
Fetches data for both caches (parallel)
    ↓
Shows loading spinner until first data arrives
    ↓
Caches populated, tabs can now switch instantly
```

#### Background Refresh (Every 30 Seconds)
```
30-second timer triggers
    ↓
Silently refetch data for both caches (parallel)
    ↓
Update cache without showing loading spinner
    ↓
UI updates smoothly to reflect new data
    ↓
Repeat every 30 seconds
```

#### User Action (e.g., Place Bet)
```
User clicks "Place Bet"
    ↓
Button shows "Placing..." state
    ↓
API call to place bet
    ↓
API responds with success
    ↓
Trigger silent cache invalidation
    ↓
Button returns to normal
    ↓
Cache updates in background
    ↓
UI updates smoothly to show new bet placement
```

### 3. Cache Invalidation

The cache is invalidated (silently refreshed) in these scenarios:

1. **User places or removes a bet** → Invalidates cache (silent refresh)
2. **Admin approves/denies a bet** → Invalidates cache (silent refresh)
3. **Admin ends a bet** → Invalidates cache (silent refresh)
4. **Admin toggles betting lock** → Invalidates cache (silent refresh)
5. **User switches parties** → Full reload with loading spinner (major context change)

**Why Silent Invalidation?**
- The user has already seen feedback from their action (e.g., "Placing..." button)
- Showing another loading spinner would be redundant and disruptive
- The cache updates in the background and the UI smoothly reflects the changes

### 4. Loading States

**Initial Load (shows spinner):**
```typescript
if (loading && bets.length === 0) {
  return <LoadingSpinner />;
}
```

**Subsequent Visits (instant display):**
```typescript
// Cache has data, show it immediately
// Background refresh updates cache without showing spinner
```

**Why Check `bets.length === 0`?**
- On first load, the cache is empty, so we show a spinner
- On subsequent visits, the cache has data from the last fetch
- Even if loading is true (background refresh), we still show the cached data

## Implementation Details

### Provider Setup (`app/dashboard/page.tsx`)

```tsx
<BetsCacheProvider
  userId={user.user_id}
  partyId={currentParty.party_id}
  password={password}
>
  <Tabs>
    <YourBetsTab />
    <BrowseBetsTab />
  </Tabs>
</BetsCacheProvider>
```

**Key Points:**
- Provider wraps the tabs section
- Receives user auth context as props
- Automatically starts background refresh interval
- Cleans up interval when unmounting or party changes

### Tab Components (e.g., `YourBetsTab.tsx`)

```tsx
export function YourBetsTab() {
  // Read from cache (all tabs share the same cache)
  const { cache, invalidateCache } = useBetsCache();

  // Extract data from cache
  const bets = cache.bets;
  const partyMembers = cache.partyMembers;
  const availableMoney = cache.availableMoney;

  // Filter data for this specific tab
  const yourBets = bets.filter(bet => bet.user_placement.has_placed);

  // After user action, trigger silent refresh
  const handleBetPlaced = async () => {
    await placeBet(...);
    await invalidateCache(); // Silent background refresh
  };

  return (
    <div>
      {/* Render with filtered cached data */}
      <BetCard bets={yourBets} />
    </div>
  );
}
```

**Key Points:**
- No local state for bets, members, or money
- Reads directly from cache (instant display)
- Calls `invalidateYourBets()` after user actions
- No loading spinners on tab switches

## Benefits of This Approach

### 1. **Instant Tab Switching**
- Users see data immediately when switching tabs
- No waiting for refetch on every tab change
- Better perceived performance

### 2. **Fresh Data**
- Background refresh keeps data current
- Users don't see stale data for long
- 30-second interval strikes balance between freshness and API load

### 3. **Smooth User Experience**
- User actions show immediate feedback ("Placing..." button)
- Background refresh doesn't disrupt the UI
- Data updates smoothly without jarring loading states

### 4. **Reduced API Calls**
- Tab switches don't trigger new API calls
- Single cache means only ONE set of API calls (not multiple per tab)
- Background refresh is centralized (one call per 30 seconds total)
- User actions trigger single silent refresh that updates all tabs

### 5. **Simple Architecture**
- Single cache = single source of truth
- Components filter data for their needs (separation of concerns)
- Less code = easier to understand and maintain
- Similar to popular libraries like React Query, SWR

### 6. **Industry Standard Pattern**
- Uses React Context (built-in, no dependencies)
- Cache stores raw data, views filter as needed
- Easy to extend (e.g., add leaderboard caching)

## Configuration

### Background Refresh Interval

Located in `/lib/bets-cache-context.tsx`:

```typescript
const BACKGROUND_REFRESH_INTERVAL = 30000; // 30 seconds
```

**To change the interval:**
1. Open `/lib/bets-cache-context.tsx`
2. Modify the `BACKGROUND_REFRESH_INTERVAL` constant
3. Value is in milliseconds (30000 = 30 seconds)

**Considerations:**
- Shorter interval = fresher data, more API calls
- Longer interval = fewer API calls, potentially staler data
- 30 seconds is a good default for most use cases

## Debugging

### Enable Cache Logging

The cache logs background refreshes to the console:

```
[BetsCache] Running background refresh...
```

**To see cache activity:**
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for `[BetsCache]` messages
4. Should see one every 30 seconds

### Common Issues

**Issue: Tabs still show loading spinner**
- **Cause:** Cache is empty on first load
- **Expected:** This is normal behavior
- **Solution:** Loading spinner should only appear once, then tabs switch instantly

**Issue: Data not updating after user action**
- **Cause:** Cache invalidation not being called
- **Check:** Ensure `invalidateCache()` is called after the action
- **Verify:** Check console for refresh logs

**Issue: Background refresh not working**
- **Cause:** Interval not started or cleared prematurely
- **Check:** Ensure BetsCacheProvider is mounted
- **Verify:** Should see console logs every 30 seconds

## Future Enhancements

Potential improvements to the caching system:

1. **Optimistic Updates**
   - Update cache immediately when user places bet
   - Revert if API call fails
   - Even faster perceived performance

2. **Configurable Refresh Interval**
   - Allow users to set refresh frequency in settings
   - More control over data freshness vs. API load

3. **Smart Refresh**
   - Only refresh when tab is active
   - Pause refreshing when user is inactive
   - Reduces unnecessary API calls

4. **Error Handling UI**
   - Show toast notifications on refresh errors
   - Currently fails silently (logs to console)
   - Better user awareness of issues

5. **Cache Persistence**
   - Store cache in localStorage
   - Instant display even on page refresh
   - More complex cache invalidation logic needed

## Related Files

- `/lib/bets-cache-context.tsx` - Cache provider implementation
- `/app/dashboard/page.tsx` - Provider setup
- `/components/YourBetsTab.tsx` - Your Bets tab consumer
- `/components/ViewBetsTab.tsx` - Browse Bets (admin) consumer
- `/components/BetsTab.tsx` - Browse Bets (non-admin) consumer

## Questions?

If you have questions about the caching strategy or need to modify it:

1. Review this document
2. Check the code comments in `/lib/bets-cache-context.tsx`
3. Look at how tabs use `useBetsCache()` hook
4. Test changes thoroughly before deploying
