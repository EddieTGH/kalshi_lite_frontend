# Loading States and Data Refresh Flow

## Overview

This document explains how action buttons trigger API calls, manage loading states, and ensure data is refreshed across all tabs before completing. The system ensures users see accurate loading feedback while maintaining a seamless experience across the entire application.

## Table of Contents

- [Core Principle](#core-principle)
- [Complete Flow](#complete-flow)
- [Action Button Patterns](#action-button-patterns)
- [Implementation Examples](#implementation-examples)
- [Architecture Diagram](#architecture-diagram)
- [Related Documentation](#related-documentation)

---

## Core Principle

**Loading states persist until ALL backend operations complete AND the frontend cache is fully refreshed.**

This means:
- ✅ Users see "Approving..." until the bet is approved AND all tabs have fresh data
- ✅ Users see "Creating..." until the bet is created AND the cache is invalidated
- ✅ Users see "Ending..." until the bet is resolved AND leaderboard data is updated
- ❌ Users DON'T see loading states disappear before data is refreshed

---

## Complete Flow

### 1. User Triggers Action

```
User clicks action button (Approve, Deny, Create Bet, etc.)
    ↓
Loading state activates
    ↓
Button text changes ("Approve" → "Approving...")
    ↓
Button becomes disabled
```

### 2. Backend API Call

```
API request sent to backend
    ↓
    Examples:
    - POST /api/bets (create bet)
    - PUT /api/bets/{id}/approve (approve bet)
    - DELETE /api/bets/{id}/deny (deny bet)
    - POST /api/bets/{id}/end (end bet)
    - POST /api/user-placed-bets (place bet)
    - DELETE /api/user-placed-bets/{id} (remove bet)
    ↓
Backend processes request
    ↓
Backend responds with success/error
```

### 3. Cache Invalidation (Critical Step)

```
API call succeeds
    ↓
**AWAIT** invalidateCache() or onBetUpdated()
    ↓
Cache invalidation triggers fresh data fetch:
    - GET /api/bets/user/{userId}?party_id={partyId}
    - GET /api/parties/{partyId}/members
    - GET /api/users/{userId}/money?party_id={partyId}
    - GET /api/settings?party_id={partyId}
    ↓
Wait for ALL endpoints to respond
    ↓
Update cache with fresh data
    ↓
All tabs receive updated data (Your Bets, Browse Bets, Leaderboard)
```

### 4. UI Update and Loading State Removal

```
Cache update completes
    ↓
React re-renders all components with fresh data
    ↓
User sees updated UI across all tabs
    ↓
**ONLY THEN** loading state is removed
    ↓
Button re-enables
    ↓
Button text returns to normal ("Approving..." → "Approve")
```

---

## Action Button Patterns

### Pattern 1: Admin Actions with `onBetUpdated` Callback

Used for: Approve, Deny, Edit & Approve

```typescript
// BetCard.tsx
const handleQuickApprove = async () => {
  if (!confirm("Are you sure you want to approve this bet as-is?")) {
    return;
  }

  setApproving(true);
  try {
    // Step 1: Make API call
    await approveBet(bet.bet_id, undefined, partyId, password);

    // Step 2: Wait for cache refresh to complete
    await onBetUpdated?.();

    // Step 3: Loading state removed in finally block (after cache updates)
  } catch (err: any) {
    alert(err.response?.data?.message || "Failed to approve bet");
  } finally {
    setApproving(false); // Only runs after everything completes
  }
};
```

**Type Safety:**
```typescript
interface BetCardProps {
  onBetUpdated?: () => Promise<void>; // Must be async
}
```

### Pattern 2: End Bet with Direct Cache Access

Used for: End Bet

```typescript
// ViewBetsTab.tsx
const handleEndBetConfirm = async () => {
  if (!selectedBetId) return;

  setEndingBet(true);
  try {
    // Step 1: Make API call
    const result = await endBet(
      selectedBetId,
      { outcome: endBetOutcome },
      partyId,
      password
    );

    setEndBetDialogOpen(false);
    setSelectedBetId(null);

    // Step 2: Wait for cache refresh
    await refreshBets(); // Calls invalidateCache()

    // Step 3: Show results dialog (after data is fresh)
    setBetEndedResult(result);
    setBetEndedDialogOpen(true);
  } catch (err: any) {
    alert(err.response?.data?.message || "Failed to end bet");
  } finally {
    setEndingBet(false); // Only runs after cache refresh
  }
};
```

### Pattern 3: User Actions (Place/Remove Bet)

Used for: Place Bet, Remove Bet

```typescript
// PlaceBetDialog.tsx
const handleSubmit = async () => {
  setLoading(true);

  try {
    // Step 1: Make API call
    const response = await placeBet({
      user_id: userId,
      bet_id: bet.bet_id,
      amount: amountNum,
      decision,
    }, partyId, password);

    // Step 2: Wait for money update callback (triggers cache refresh)
    await onMoneyChange(response.user_money_remaining);

    // Step 3: Wait for bet list refresh
    await onSuccess();

    // Step 4: Close dialog and reset form (after all updates)
    onOpenChange(false);
    setAmount("");
  } catch (err: any) {
    setError(err.response?.data?.message || "Failed to place bet");
  } finally {
    setLoading(false); // Only runs after all refreshes complete
  }
};
```

### Pattern 4: Create Bet with Cache Context

Used for: Create Bet, Suggest Bet

```typescript
// CreateBetsTab.tsx
const { invalidateCache } = useBetsCache();

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);

  try {
    // Step 1: Make API call
    await createBet({
      name: name.trim(),
      description: description.trim(),
      odds_for_yes: odds,
      people_involved: peopleInvolved,
    }, partyId, password);

    // Step 2: Invalidate cache to refresh all bet data
    await invalidateCache();

    // Step 3: Show success and reset form (after cache updates)
    setSuccess("Bet created successfully!");
    setName("");
    setDescription("");
    setOddsForYes("50");
    setPeopleInvolved([]);

    // Step 4: Execute callback (e.g., tab navigation)
    if (onBetCreated) {
      await onBetCreated();
    }
  } catch (err: any) {
    setError(err.response?.data?.message || "Failed to create bet");
  } finally {
    setLoading(false); // Only runs after everything completes
  }
};
```

### Pattern 5: Full-Screen Loading Overlay

Used for: Lock Bets

```typescript
// ViewBetsTab.tsx
const handleLockToggle = async (checked: boolean) => {
  setLockLoading(true);
  try {
    // Step 1: Make API call
    await updateLockStatus({ bets_locked: checked }, partyId, password);

    // Step 2: Refresh cache to update lock status
    await refreshBets();

    // Step 3: Full-screen overlay persists until cache updates
  } catch (err: any) {
    alert(err.response?.data?.message || "Failed to update lock status");
  } finally {
    setLockLoading(false); // Overlay disappears after cache refresh
  }
};

// In JSX
<LoadingOverlay
  isVisible={lockLoading}
  message="Updating betting status..."
/>
```

---

## Implementation Examples

### Example 1: Approving a Bet

**User Action:**
1. Admin clicks "Approve" button on a pending bet

**What Happens:**

```
[00:00] User clicks "Approve"
[00:01] Button shows "Approving..." and disables
[00:02] API call: PUT /api/bets/123/approve
[00:03] Backend approves bet, responds with 200 OK
[00:04] Cache invalidation starts
[00:05] Fetch: GET /api/bets/user/2?party_id=1
[00:06] Backend returns updated bet list (bet now approved)
[00:07] Cache updates with new data
[00:08] React re-renders:
        - Your Bets tab: Shows bet as approved
        - Browse Bets tab: Bet appears (now that it's approved)
        - Leaderboard tab: Updated if needed
[00:09] finally block executes
[00:10] setApproving(false) runs
[00:11] Button shows "Approve" again and re-enables
```

**Total Duration:** ~1 second
**User Sees:** "Approving..." for the entire duration

### Example 2: Creating a New Bet

**User Action:**
1. User fills out create bet form and clicks "Create Bet"

**What Happens:**

```
[00:00] User clicks "Create Bet"
[00:01] Button shows "Creating..." and disables
[00:02] Form inputs become disabled
[00:03] API call: POST /api/bets
[00:04] Backend creates bet, responds with new bet data
[00:05] invalidateCache() called
[00:06] Fetch: GET /api/bets/user/2?party_id=1
[00:07] Fetch: GET /api/parties/1/members
[00:08] Fetch: GET /api/users/2/money?party_id=1
[00:09] All requests complete
[00:10] Cache updates with fresh data including new bet
[00:11] Success message appears
[00:12] Form resets
[00:13] Tab switches to "Your Bets"
[00:14] Your Bets tab shows new bet immediately (from cache)
[00:15] finally block executes
[00:16] setLoading(false) runs
[00:17] Button shows "Create Bet" again
```

**Total Duration:** ~1.5 seconds
**User Sees:** "Creating..." for the entire duration, then instant navigation with data already loaded

### Example 3: Ending a Bet

**User Action:**
1. Admin selects outcome (YES/NO) and clicks "Confirm & End Bet"

**What Happens:**

```
[00:00] User clicks "Confirm & End Bet"
[00:01] Button shows "Ending..." and disables
[00:02] API call: POST /api/bets/123/end
[00:03] Backend resolves bet, calculates payouts, responds with results
[00:04] Dialog closes
[00:05] Cache invalidation starts (await refreshBets())
[00:06] Fetch: GET /api/bets/user/2?party_id=1
[00:07] Fetch: GET /api/parties/1/members (for updated leaderboard)
[00:08] Fetch: GET /api/users/2/money?party_id=1 (updated balance)
[00:09] All requests complete
[00:10] Cache updates with:
        - Bet marked as resolved
        - User balances updated
        - Leaderboard rankings updated
[00:11] React re-renders all tabs with fresh data
[00:12] Results dialog shows (with accurate payout info)
[00:13] finally block executes
[00:14] setEndingBet(false) runs
[00:15] All tabs show updated state
```

**Total Duration:** ~1.5 seconds
**User Sees:** "Ending..." until results dialog appears with fully updated data

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Interface                          │
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │Your Bets │  │Browse    │  │Create    │  │Leader-   │      │
│  │Tab       │  │Bets Tab  │  │Bet Tab   │  │board Tab │      │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘      │
│       │             │              │             │             │
│       └─────────────┴──────────────┴─────────────┘             │
│                          │                                      │
└──────────────────────────┼──────────────────────────────────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │  BetsCache Context     │
              │  (Single Source of     │
              │   Truth)               │
              │                        │
              │  • bets[]              │
              │  • partyMembers[]      │
              │  • availableMoney      │
              │  • betsLocked          │
              │                        │
              │  invalidateCache()     │
              └────────┬───────────────┘
                       │
                       │ On user action:
                       │ 1. API call completes
                       │ 2. AWAIT invalidateCache()
                       │ 3. Fetch fresh data
                       │ 4. Update cache
                       │ 5. Remove loading state
                       │
                       ▼
        ┌──────────────────────────────────┐
        │      Backend API Endpoints        │
        ├──────────────────────────────────┤
        │                                   │
        │  Action APIs (Mutations):         │
        │  • POST   /api/bets               │
        │  • PUT    /api/bets/{id}/approve  │
        │  • DELETE /api/bets/{id}/deny     │
        │  • POST   /api/bets/{id}/end      │
        │  • POST   /api/user-placed-bets   │
        │  • DELETE /api/user-placed-bets/  │
        │                                   │
        │  Data APIs (Queries):             │
        │  • GET /api/bets/user/{id}        │
        │  • GET /api/parties/{id}/members  │
        │  • GET /api/users/{id}/money      │
        │  • GET /api/settings              │
        │                                   │
        └───────────────────────────────────┘
```

### Data Flow on User Action

```
┌──────────────┐
│ User clicks  │
│ "Approve"    │
└──────┬───────┘
       │
       ▼
┌──────────────────────┐
│ setApproving(true)   │
│ Button: "Approving..." │
│ Disabled: true       │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ API Call             │
│ PUT /api/bets/123/   │
│     approve          │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ await onBetUpdated() │
│ (or invalidateCache)│
└──────┬───────────────┘
       │
       ├─────────────────────────────────────┐
       │                                     │
       ▼                                     ▼
┌──────────────────┐              ┌──────────────────┐
│ GET /api/bets/   │              │ GET /api/parties/│
│     user/2       │              │     1/members    │
└────────┬─────────┘              └────────┬─────────┘
         │                                 │
         └────────────┬────────────────────┘
                      │
                      ▼
         ┌────────────────────────┐
         │ Cache Updates          │
         │ All tabs re-render     │
         └────────┬───────────────┘
                  │
                  ▼
         ┌────────────────────────┐
         │ finally block          │
         │ setApproving(false)    │
         └────────┬───────────────┘
                  │
                  ▼
         ┌────────────────────────┐
         │ Button: "Approve"      │
         │ Disabled: false        │
         │ Fresh data visible     │
         └────────────────────────┘
```

---

## Silent Background Updates

### What is "Silent"?

"Silent" means the cache refresh happens without showing a loading spinner, but the data still updates across all tabs.

**Example Scenarios:**

1. **30-Second Auto-Refresh**
   ```
   User is viewing Your Bets tab
       ↓
   30 seconds pass
       ↓
   Cache silently refetches data
       ↓
   No loading spinner shown
       ↓
   User sees updated bet data smoothly appear
   ```

2. **After User Action**
   ```
   User places a bet
       ↓
   Button shows "Placing..."
       ↓
   API call completes
       ↓
   Cache invalidates (silent refresh)
       ↓
   User switches to Browse Bets tab
       ↓
   Fresh data is already there (no loading spinner)
   ```

### Why Silent Updates Matter

1. **Seamless Experience**: Users don't see loading spinners interrupting their flow
2. **Multi-Tab Consistency**: All tabs show the same data at the same time
3. **Real-Time Feel**: Changes appear immediately without manual refresh
4. **Loading State Integrity**: Action buttons show loading until ALL tabs have fresh data

---

## Key Implementation Details

### 1. Async Callback Pattern

All callbacks that trigger cache updates must be async:

```typescript
// ❌ Wrong - callback finishes before cache updates
onBetUpdated?: () => void;

// ✅ Correct - can await cache update
onBetUpdated?: () => Promise<void>;
```

### 2. Always Use `await` Before Finally

```typescript
// ❌ Wrong - loading state removed before cache updates
try {
  await apiCall();
  invalidateCache(); // Not awaited!
} finally {
  setLoading(false); // Runs immediately
}

// ✅ Correct - loading state persists until cache updates
try {
  await apiCall();
  await invalidateCache(); // Awaited!
} finally {
  setLoading(false); // Runs after cache updates
}
```

### 3. Cache Context Access

Components can access cache invalidation in two ways:

**Method 1: Via Props (Callback)**
```typescript
// Parent component
<BetCard
  onBetUpdated={refreshBets} // refreshBets calls invalidateCache()
/>

// Child component
await onBetUpdated?.();
```

**Method 2: Direct Hook Access**
```typescript
// Inside component
const { invalidateCache } = useBetsCache();

// In handler
await invalidateCache();
```

### 4. Loading State Naming Convention

```typescript
// Action buttons use present participle
const [approving, setApproving] = useState(false);
const [denying, setDenying] = useState(false);
const [removing, setRemoving] = useState(false);
const [endingBet, setEndingBet] = useState(false);

// Generic loaders use "loading"
const [loading, setLoading] = useState(false);
const [lockLoading, setLockLoading] = useState(false);
```

### 5. Button State Management

```typescript
// Disable button during loading
disabled={approving}

// Show loading text
{approving ? "Approving..." : "Approve"}

// Consider other actions
disabled={approving || denying} // Can't deny while approving
```

---

## Benefits of This Approach

### 1. Data Consistency
- All tabs always show the same data
- No stale data issues
- No race conditions between tabs

### 2. User Feedback
- Clear loading states show when operations are in progress
- Loading states persist until operations truly complete
- Users know when it's safe to perform another action

### 3. Performance
- Single cache reduces API calls from 3× to 1×
- Background updates prevent blocking the UI
- Instant tab switching (data already cached)

### 4. Developer Experience
- Consistent pattern across all actions
- Type-safe async callbacks
- Easy to add new actions following the pattern

### 5. Error Handling
- Errors caught before cache updates
- Loading states properly cleaned up in finally blocks
- Users see clear error messages

---

## Common Pitfalls and Solutions

### Pitfall 1: Forgetting to Await

**Problem:**
```typescript
try {
  await apiCall();
  invalidateCache(); // ❌ Not awaited
} finally {
  setLoading(false); // Removes loading before cache updates
}
```

**Solution:**
```typescript
try {
  await apiCall();
  await invalidateCache(); // ✅ Awaited
} finally {
  setLoading(false); // Removes loading after cache updates
}
```

### Pitfall 2: Callback Type Mismatch

**Problem:**
```typescript
interface Props {
  onBetUpdated?: () => void; // ❌ Not async
}

// Later:
await onBetUpdated?.(); // TypeScript error or runtime issue
```

**Solution:**
```typescript
interface Props {
  onBetUpdated?: () => Promise<void>; // ✅ Async
}

// Later:
await onBetUpdated?.(); // Works correctly
```

### Pitfall 3: Optional Chaining Without Await

**Problem:**
```typescript
onBetUpdated?.(); // ❌ Called but not awaited
await invalidateCache();
```

**Solution:**
```typescript
await onBetUpdated?.(); // ✅ Properly awaited
await invalidateCache();
```

### Pitfall 4: Setting Success State Too Early

**Problem:**
```typescript
try {
  await createBet();
  setSuccess("Bet created!"); // ❌ Shows before cache updates
  await invalidateCache();
} finally {
  setLoading(false);
}
```

**Solution:**
```typescript
try {
  await createBet();
  await invalidateCache(); // ✅ Update cache first
  setSuccess("Bet created!"); // Then show success
} finally {
  setLoading(false);
}
```

---

## Testing Checklist

When implementing a new action, verify:

- [ ] Loading state activates when action starts
- [ ] Button/input becomes disabled during loading
- [ ] Button text changes to show action ("Approving...", "Creating...", etc.)
- [ ] API call is awaited
- [ ] Cache invalidation or callback is awaited
- [ ] Loading state persists until cache updates complete
- [ ] All tabs show updated data after action completes
- [ ] Loading state is removed in finally block
- [ ] Error states are handled properly
- [ ] Success messages appear after cache updates

---

## Related Documentation

- [Caching Strategy](./caching-strategy.md) - Overview of the caching architecture
- [BetsCache Context](../lib/bets-cache-context.tsx) - Cache implementation
- [API Contract](../api_contract.md) - Backend API endpoints

---

## Summary

The loading state and data refresh system ensures:

1. **User sees accurate feedback** - Loading states persist until operations truly complete
2. **Data stays consistent** - All tabs update simultaneously via shared cache
3. **No race conditions** - Await ensures proper sequencing
4. **Smooth experience** - Background updates don't interrupt users
5. **Type safety** - Async callbacks enforced by TypeScript

By following the patterns in this document, all user actions maintain data integrity while providing clear, honest feedback about operation status.
