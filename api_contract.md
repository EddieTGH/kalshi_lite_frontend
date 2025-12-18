# Kalshi Lite - API Contract

**Version:** 2.0
**Base URL:** `http://localhost:3001/api`
**Environment:** Development

---

## 🚨 BREAKING CHANGES - Multi-Party Migration (v2.0)

**IMPORTANT:** Version 2.0 introduces multi-party support. This is a **major breaking change** that affects most endpoints.

### What Changed

#### 1. **Party Context Required**

Most endpoints now require a `party_id` query parameter:

```
❌ OLD: POST /api/bets
✅ NEW: POST /api/bets?party_id=1
```

#### 2. **User Model Changed**

```typescript
// ❌ OLD User Model
interface User {
  user_id: number;
  name: string;
  password: string;
  admin: boolean; // REMOVED - now party-specific
  money: number; // REMOVED - now party-specific
}

// ✅ NEW User Model
interface User {
  user_id: number;
  name: string;
  password: string;
  membership_tier: "basic" | "vip"; // NEW
  remaining_hosts: number; // NEW
}
```

#### 3. **Party-Specific Data**

- **Admin status** is now per-party (stored in `party_members` table)
- **User balances** are now per-party (each party has separate money)
- **Lock status** is now per-party (no global settings table)
- **Leaderboard** is now per-party

#### 4. **Authentication Changes**

- Global `requireAdmin` middleware removed
- New `requirePartyAdmin` - checks admin status for specific party
- New `requirePartyMember` - checks if user is member of specific party

#### 5. **Removed Endpoints**

```
❌ GET /api/users - Leaderboard is now party-specific
   Use: GET /api/parties/:party_id/members instead
```

#### 6. **New Endpoints**

```
✅ POST /api/parties - Create new party
✅ GET /api/parties - Get user's parties
✅ POST /api/parties/join - Join party with code
✅ GET /api/parties/:party_id - Get party details
✅ GET /api/parties/:party_id/members - Get party leaderboard
✅ And more party management endpoints...
```

### Migration Guide for Frontend

**Step 1: Update User Registration/Login Handling**

```javascript
// OLD response
{
  "user_id": 1,
  "name": "Alice",
  "password": "ABC",
  "admin": false,      // REMOVED
  "money": 100         // REMOVED
}

// NEW response
{
  "user_id": 1,
  "name": "Alice",
  "password": "ABC",
  "membership_tier": "basic",  // NEW
  "remaining_hosts": 1         // NEW
}
```

**Step 2: Track Current Party**

```javascript
// Store current party context
localStorage.setItem("currentPartyId", "1");

// Include in all party-scoped requests
const partyId = localStorage.getItem("currentPartyId");
```

**Step 3: Update All Bet/Settings Endpoints**

```javascript
// OLD
fetch('http://localhost:3001/api/bets', {...})

// NEW
fetch(`http://localhost:3001/api/bets?party_id=${partyId}`, {...})
```

**Step 4: Replace Leaderboard Endpoint**

```javascript
// OLD
fetch('http://localhost:3001/api/users', {...})

// NEW
fetch(`http://localhost:3001/api/parties/${partyId}/members`, {...})
```

---

## Table of Contents

1. [Authentication](#authentication)
2. [Error Handling](#error-handling)
3. [Party Endpoints](#party-endpoints) **NEW**
4. [User Endpoints](#user-endpoints)
5. [Bet Endpoints](#bet-endpoints)
6. [User Placed Bet Endpoints](#user-placed-bet-endpoints)
7. [Settings Endpoints](#settings-endpoints)
8. [Data Models](#data-models)

---

## Authentication

### Method: Password-Based Authentication

The API uses a simple password-based authentication system. No JWT tokens or session management is required.

### How It Works

**For Protected Endpoints:**

- Include the user's 3-character password in the request header
- Header name: `password`
- Header value: User's password (e.g., `"ABC"`)

**Example:**

```javascript
// Fetch API
fetch("http://localhost:3001/api/parties", {
  headers: {
    password: "ABC",
    "Content-Type": "application/json",
  },
});

// Axios
axios.get("http://localhost:3001/api/parties", {
  headers: {
    password: "ABC",
  },
});
```

### Unprotected Endpoints (No Auth Required)

- `POST /api/users/register` - Create new account
- `POST /api/users/login` - Authenticate user

### Protected Endpoints (Auth Required)

All other endpoints require the `password` header.

### Party Admin Endpoints

These endpoints require authentication AND the user must be an **admin of the specific party**:

- `POST /api/bets?party_id=X` - Create bet
- `PUT /api/bets/:id?party_id=X` - Update bet
- `DELETE /api/bets/:id?party_id=X` - Delete bet
- `PUT /api/bets/:id/end?party_id=X` - End bet
- `PUT /api/settings/lock_bets?party_id=X` - Lock/unlock betting
- `PUT /api/parties/:party_id` - Update party
- `DELETE /api/parties/:party_id` - Delete party
- `POST /api/parties/:party_id/members` - Add member to party
- `PUT /api/parties/:party_id/members/:user_id` - Update member
- `DELETE /api/parties/:party_id/members/:user_id` - Remove member

### Party Member Endpoints

These endpoints require authentication AND the user must be a **member of the specific party**:

- `GET /api/bets/user/:user_id?party_id=X` - Get user's bets
- `POST /api/user_placed_bets?party_id=X` - Place bet
- `DELETE /api/user_placed_bets/:id?party_id=X` - Remove bet
- `GET /api/settings/lock_status?party_id=X` - Check lock status
- `GET /api/parties/:party_id` - Get party details
- `GET /api/parties/:party_id/members` - Get party members/leaderboard

---

## Error Handling

### Standard Error Response Format

```json
{
  "status": "error",
  "statusCode": 400,
  "message": "Error message here",
  "timestamp": "2025-11-08T19:00:00.000Z",
  "path": "/api/endpoint"
}
```

### Validation Error Response Format

```json
{
  "status": "error",
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "field": "body.name",
      "message": "Name is required",
      "code": "invalid_type"
    }
  ],
  "timestamp": "2025-11-08T19:00:00.000Z",
  "path": "/api/endpoint"
}
```

### HTTP Status Codes

| Code | Meaning               | Common Scenarios                                                                      |
| ---- | --------------------- | ------------------------------------------------------------------------------------- |
| 200  | OK                    | Successful GET, PUT, DELETE                                                           |
| 201  | Created               | Successful POST (resource created)                                                    |
| 400  | Bad Request           | Invalid input, validation errors, business rule violations                            |
| 401  | Unauthorized          | Missing or invalid password                                                           |
| 403  | Forbidden             | Non-admin trying to access party admin endpoint, or non-member trying to access party |
| 404  | Not Found             | Resource doesn't exist                                                                |
| 409  | Conflict              | Duplicate resource (e.g., join code already exists)                                   |
| 500  | Internal Server Error | Server-side error                                                                     |

### Common Error Messages

| Error                                                           | Meaning                                       |
| --------------------------------------------------------------- | --------------------------------------------- |
| `"Authentication required. Please provide password in header."` | Missing password header                       |
| `"Invalid password"`                                            | Password doesn't match any user               |
| `"Party admin access required"`                                 | Non-admin user trying party admin endpoint    |
| `"Party membership required"`                                   | Non-member trying to access party             |
| `"Insufficient funds. Available: $X, Required: $Y"`             | User doesn't have enough money in this party  |
| `"Cannot place bet - betting is currently locked"`              | Party admin has locked betting for this party |
| `"Cannot bet on this - you are involved in the outcome"`        | User is in `people_involved` array            |
| `"Party not found"`                                             | Party ID doesn't exist                        |
| `"Bet does not belong to this party"`                           | Trying to access bet from different party     |
| `"Insufficient hosting slots"`                                  | User has no remaining_hosts to create party   |

---

## Party Endpoints

### POST /api/parties

Create a new party (requires available hosting slots).

**Authentication:** Required
**Method:** `POST`
**URL:** `/api/parties`

**Request Headers:**

```
password: ABC
Content-Type: application/json
```

**Request Body:**

```json
{
  "name": "New Year's Eve 2025",
  "description": "NYE betting party with friends",
  "date": "2025-12-31",
  "starting_balance": 150
}
```

**Request Schema:**

- `name` (string, required): 1-200 characters
- `description` (string, optional): Max 1000 characters
- `date` (string, required): ISO date format (YYYY-MM-DD)
- `starting_balance` (integer, optional): Default 100, minimum 0

**Success Response (201):**

```json
{
  "party_id": 5,
  "name": "New Year's Eve 2025",
  "description": "NYE betting party with friends",
  "date": "2025-12-31T00:00:00.000Z",
  "join_code": "XYZ",
  "locked_status": false,
  "starting_balance": 150,
  "created_at": "2025-11-10T10:00:00.000Z"
}
```

**What Happens:**

1. User's `remaining_hosts` is decremented by 1
2. System auto-generates unique 3-letter join code (A-Z only)
3. Creator is automatically added as party admin with starting balance
4. Party can be deleted before the date to refund hosting slot

**Error Responses:**

- `401` - Invalid or missing password
- `400` - Insufficient hosting slots (remaining_hosts = 0)
- `400` - Validation error (invalid date format, etc.)
- `400` - Date must be in the future

---

### GET /api/parties

Get all parties the authenticated user is a member of.

**Authentication:** Required
**Method:** `GET`
**URL:** `/api/parties`

**Request Headers:**

```
password: ABC
```

**Success Response (200):**

```json
{
  "parties": [
    {
      "party_id": 1,
      "name": "Default Party",
      "description": "Original party from migration",
      "date": "2025-12-31T00:00:00.000Z",
      "join_code": "LEG",
      "locked_status": false,
      "starting_balance": 100,
      "is_admin": true,
      "member_count": 5
    },
    {
      "party_id": 3,
      "name": "Super Bowl Party",
      "description": "Big game betting",
      "date": "2026-02-07T00:00:00.000Z",
      "join_code": "NFL",
      "locked_status": false,
      "starting_balance": 200,
      "is_admin": false,
      "member_count": 12
    }
  ]
}
```

**Response Fields:**

- `is_admin` (boolean): Whether user is admin of this party
- `member_count` (number): Total members in party
- Parties are sorted by creation date (newest first)

**Error Responses:**

- `401` - Invalid or missing password

---

### POST /api/parties/join

Join a party using a 3-letter join code.

**Authentication:** Required
**Method:** `POST`
**URL:** `/api/parties/join`

**Request Headers:**

```
password: ABC
Content-Type: application/json
```

**Request Body:**

```json
{
  "join_code": "XYZ"
}
```

**Request Schema:**

- `join_code` (string, required): Exactly 3 uppercase letters (A-Z)

**Success Response (200):**

```json
{
  "party_id": 5,
  "name": "New Year's Eve 2025",
  "description": "NYE betting party with friends",
  "date": "2025-12-31T00:00:00.000Z",
  "join_code": "XYZ",
  "locked_status": false,
  "starting_balance": 150,
  "user_money": 150,
  "message": "Successfully joined party"
}
```

**What Happens:**

1. User is added to party_members with party's starting_balance
2. User is granted access to all party endpoints
3. User can now see and place bets in this party

**Error Responses:**

- `401` - Invalid or missing password
- `404` - Party not found with that join code
- `400` - Already a member of this party
- `400` - Join code must be exactly 3 uppercase letters

---

### GET /api/parties/:party_id

Get details for a specific party.

**Authentication:** Required (must be party member)
**Method:** `GET`
**URL:** `/api/parties/:party_id`

**URL Parameters:**

- `party_id` (integer): Party ID

**Request Headers:**

```
password: ABC
```

**Success Response (200):**

```json
{
  "party_id": 5,
  "name": "New Year's Eve 2025",
  "description": "NYE betting party with friends",
  "date": "2025-12-31T00:00:00.000Z",
  "join_code": "XYZ",
  "locked_status": false,
  "starting_balance": 150,
  "created_at": "2025-11-10T10:00:00.000Z"
}
```

**Error Responses:**

- `401` - Invalid or missing password
- `403` - Not a member of this party
- `404` - Party not found

---

### GET /api/parties/:party_id/members

Get all members of a party with their balances (party-specific leaderboard).

**Authentication:** Required (must be party member)
**Method:** `GET`
**URL:** `/api/parties/:party_id/members`

**URL Parameters:**

- `party_id` (integer): Party ID

**Request Headers:**

```
password: ABC
```

**Success Response (200):**

```json
{
  "members": [
    {
      "user_id": 2,
      "name": "Alice",
      "admin": true,
      "money": 150,
      "total_money": 180,
      "joined_at": "2025-11-10T10:00:00.000Z"
    },
    {
      "user_id": 5,
      "name": "Bob",
      "admin": false,
      "money": 100,
      "total_money": 150,
      "joined_at": "2025-11-10T11:30:00.000Z"
    },
    {
      "user_id": 8,
      "name": "Charlie",
      "admin": false,
      "money": 80,
      "total_money": 80,
      "joined_at": "2025-11-10T12:00:00.000Z"
    }
  ]
}
```

**Response Fields:**

- `admin` (boolean): Party-specific admin status
- `money` (number): Available cash in this party (not invested)
- `total_money` (number): `money` + money invested in active bets for this party
- Members are sorted by `total_money` descending (highest first)

**Use Case:** This replaces the old global `GET /api/users` endpoint for leaderboards

**Error Responses:**

- `401` - Invalid or missing password
- `403` - Not a member of this party
- `404` - Party not found

---

### PUT /api/parties/:party_id

Update party details (party admin only).

**Authentication:** Required (party admin)
**Method:** `PUT`
**URL:** `/api/parties/:party_id`

**URL Parameters:**

- `party_id` (integer): Party ID

**Request Headers:**

```
password: ABC
Content-Type: application/json
```

**Request Body (all fields optional):**

```json
{
  "name": "New Year's Eve 2026",
  "description": "Updated description",
  "date": "2026-12-31",
  "starting_balance": 200
}
```

**Request Schema:**

- `name` (string, optional): 1-200 characters
- `description` (string, optional): Max 1000 characters
- `date` (string, optional): ISO date format (YYYY-MM-DD)
- `starting_balance` (integer, optional): Minimum 0

**Success Response (200):**

```json
{
  "party_id": 5,
  "name": "New Year's Eve 2026",
  "description": "Updated description",
  "date": "2026-12-31T00:00:00.000Z",
  "join_code": "XYZ",
  "locked_status": false,
  "starting_balance": 200,
  "created_at": "2025-11-10T10:00:00.000Z"
}
```

**Note:** Changing `starting_balance` does NOT affect existing members' balances.

**Error Responses:**

- `401` - Invalid or missing password
- `403` - Not a party admin
- `404` - Party not found
- `400` - Validation error

---

### DELETE /api/parties/:party_id

Delete a party and all associated data (party admin only).

**Authentication:** Required (party admin)
**Method:** `DELETE`
**URL:** `/api/parties/:party_id`

**URL Parameters:**

- `party_id` (integer): Party ID

**Request Headers:**

```
password: ABC
```

**Success Response (200):**

```json
{
  "message": "Party deleted successfully",
  "party_id": 5,
  "host_refunded": true
}
```

**What Happens:**

1. All party members are removed
2. All bets in this party are deleted
3. All placed bets in this party are deleted
4. If party date hasn't passed, creator's `remaining_hosts` is refunded (+1)

**Response Fields:**

- `host_refunded` (boolean): Whether hosting slot was refunded to creator

**Error Responses:**

- `401` - Invalid or missing password
- `403` - Not a party admin
- `404` - Party not found

---

### POST /api/parties/:party_id/members

Add a user to the party (party admin only).

**Authentication:** Required (party admin)
**Method:** `POST`
**URL:** `/api/parties/:party_id/members`

**URL Parameters:**

- `party_id` (integer): Party ID

**Request Headers:**

```
password: ABC
Content-Type: application/json
```

**Request Body:**

```json
{
  "user_id": 10,
  "admin": false,
  "money": 150
}
```

**Request Schema:**

- `user_id` (integer, required): User to add
- `admin` (boolean, optional): Default false
- `money` (integer, optional): Starting balance, defaults to party's starting_balance

**Success Response (201):**

```json
{
  "id": 42,
  "party_id": 5,
  "user_id": 10,
  "admin": false,
  "money": 150,
  "joined_at": "2025-11-10T15:00:00.000Z"
}
```

**Error Responses:**

- `401` - Invalid or missing password
- `403` - Not a party admin
- `404` - Party or user not found
- `409` - User is already a member of this party

---

### PUT /api/parties/:party_id/members/:user_id

Update a member's admin status or money (party admin only).

**Authentication:** Required (party admin)
**Method:** `PUT`
**URL:** `/api/parties/:party_id/members/:user_id`

**URL Parameters:**

- `party_id` (integer): Party ID
- `user_id` (integer): User ID to update

**Request Headers:**

```
password: ABC
Content-Type: application/json
```

**Request Body (at least one field required):**

```json
{
  "admin": true,
  "money": 200
}
```

**Request Schema:**

- `admin` (boolean, optional): Update admin status
- `money` (integer, optional): Update balance (minimum 0)

**Success Response (200):**

```json
{
  "id": 42,
  "party_id": 5,
  "user_id": 10,
  "admin": true,
  "money": 200,
  "joined_at": "2025-11-10T15:00:00.000Z"
}
```

**Error Responses:**

- `401` - Invalid or missing password
- `403` - Not a party admin
- `404` - Party or member not found
- `400` - No fields provided to update

---

### DELETE /api/parties/:party_id/members/:user_id

Remove a member from the party (party admin only).

**Authentication:** Required (party admin)
**Method:** `DELETE`
**URL:** `/api/parties/:party_id/members/:user_id`

**URL Parameters:**

- `party_id` (integer): Party ID
- `user_id` (integer): User ID to remove

**Request Headers:**

```
password: ABC
```

**Success Response (200):**

```json
{
  "message": "Member removed from party successfully",
  "user_id": 10,
  "party_id": 5
}
```

**What Happens:**

1. User is removed from party_members
2. All their placed bets in this party are deleted (cascade)
3. User loses access to all party endpoints for this party

**Error Responses:**

- `401` - Invalid or missing password
- `403` - Not a party admin
- `404` - Party or member not found
- `400` - Cannot remove yourself (last admin)

---

## User Endpoints

### POST /api/users/register

Create a new user account. System automatically generates a unique 3-character password.

**Authentication:** None
**Method:** `POST`
**URL:** `/api/users/register`

**Request Body:**

```json
{
  "name": "Alice"
}
```

**Request Schema:**

- `name` (string, required): 1-100 characters

**Success Response (201):**

```json
{
  "user_id": 4,
  "name": "Alice",
  "password": "HCO",
  "membership_tier": "basic",
  "remaining_hosts": 1
}
```

**Response Fields:**

- `password` (string): Auto-generated 3-character code - save this for authentication!
- `membership_tier` (string): Always "basic" for new users
- `remaining_hosts` (number): Number of parties user can create (starts at 1)

**Important:** Save the returned `password` - user will need it to authenticate!

**Error Responses:**

- `400` - Name already exists
- `400` - Validation error (name too long, etc.)

---

### POST /api/users/login

Authenticate a user with their password and get user details.

**Authentication:** None
**Method:** `POST`
**URL:** `/api/users/login`

**Request Body:**

```json
{
  "password": "HCO"
}
```

**Request Schema:**

- `password` (string, required): Exactly 3 uppercase alphanumeric characters (A-Z, 0-9)

**Success Response (200):**

```json
{
  "user_id": 4,
  "name": "Alice",
  "membership_tier": "basic",
  "remaining_hosts": 1
}
```

**Error Responses:**

- `401` - Invalid password
- `400` - Password format invalid

---

### GET /api/users/:id

Get specific user details by ID.

**Authentication:** Required
**Method:** `GET`
**URL:** `/api/users/:id`

**URL Parameters:**

- `id` (integer): User ID

**Request Headers:**

```
password: ABC
```

**Success Response (200):**

```json
{
  "user_id": 4,
  "name": "Alice",
  "membership_tier": "basic",
  "remaining_hosts": 0
}
```

**Note:** This endpoint returns global user data only. For party-specific data (money, admin status), use `GET /api/parties/:party_id/members`.

**Error Responses:**

- `401` - Invalid or missing password
- `404` - User not found

---

## Bet Endpoints

**IMPORTANT:** All bet endpoints now require `?party_id=X` query parameter.

### POST /api/bets?party_id=X

Create a new bet in a specific party (party admin only).

**Authentication:** Required (party admin)
**Method:** `POST`
**URL:** `/api/bets?party_id=1`

**Query Parameters:**

- `party_id` (integer, required): Party ID

**Request Headers:**

```
password: ABC
Content-Type: application/json
```

**Request Body:**

```json
{
  "name": "Will it rain tomorrow?",
  "description": "Will it rain in San Francisco tomorrow?",
  "odds_for_yes": 70,
  "people_involved": [1, 3]
}
```

**Request Schema:**

- `name` (string, required): 1-200 characters
- `description` (string, required): 1-1000 characters
- `odds_for_yes` (integer, required): 0-100 (percentage)
- `people_involved` (array of integers, optional): User IDs involved in bet outcome. Default `[]`

**Success Response (201):**

```json
{
  "bet_id": 6,
  "party_id": 1,
  "name": "Will it rain tomorrow?",
  "description": "Will it rain in San Francisco tomorrow?",
  "odds_for_yes": 70,
  "odds_for_no": 30,
  "people_involved": [1, 3],
  "in_progress": true,
  "outcome": null
}
```

**Response Notes:**

- `odds_for_no` is automatically calculated as `100 - odds_for_yes`
- `in_progress` starts as `true`
- `outcome` starts as `null`
- `party_id` is included in response

**Error Responses:**

- `401` - Invalid or missing password
- `403` - Not a party admin
- `400` - Validation error
- `400` - party_id query parameter required

---

### PUT /api/bets/:id?party_id=X

Update bet metadata (party admin only). Cannot update if bets are locked.

**Authentication:** Required (party admin)
**Method:** `PUT`
**URL:** `/api/bets/6?party_id=1`

**URL Parameters:**

- `id` (integer): Bet ID

**Query Parameters:**

- `party_id` (integer, required): Party ID

**Request Headers:**

```
password: ABC
Content-Type: application/json
```

**Request Body (all fields optional):**

```json
{
  "name": "Will it rain tomorrow in NYC?",
  "description": "Updated description",
  "odds_for_yes": 65,
  "people_involved": [1]
}
```

**Request Schema:**

- `name` (string, optional): 1-200 characters
- `description` (string, optional): 1-1000 characters
- `odds_for_yes` (integer, optional): 0-100
- `people_involved` (array of integers, optional): User IDs

**Success Response (200):**

```json
{
  "bet_id": 6,
  "party_id": 1,
  "name": "Will it rain tomorrow in NYC?",
  "description": "Updated description",
  "odds_for_yes": 65,
  "odds_for_no": 35,
  "people_involved": [1],
  "in_progress": true,
  "outcome": null
}
```

**Error Responses:**

- `401` - Invalid or missing password
- `403` - Not a party admin
- `404` - Bet not found
- `400` - Cannot edit bet - bets are locked (party-specific)
- `400` - Bet does not belong to this party

---

### DELETE /api/bets/:id?party_id=X

Delete a bet (party admin only). If users have placed bets, they will be refunded automatically.

**Authentication:** Required (party admin)
**Method:** `DELETE`
**URL:** `/api/bets/6?party_id=1`

**URL Parameters:**

- `id` (integer): Bet ID

**Query Parameters:**

- `party_id` (integer, required): Party ID

**Request Headers:**

```
password: ABC
```

**Success Response (200):**

```json
{
  "message": "Bet deleted successfully",
  "bet_id": 6
}
```

**Error Responses:**

- `401` - Invalid or missing password
- `403` - Not a party admin
- `404` - Bet not found
- `400` - Bet does not belong to this party

---

### GET /api/bets/user/:user_id?party_id=X

Get all bets in a specific party for a user, excluding bets where they are involved in the outcome.

Returns all party bets with the user's placement status.

**Authentication:** Required (party member)
**Method:** `GET`
**URL:** `/api/bets/user/4?party_id=1`

**URL Parameters:**

- `user_id` (integer): User ID

**Query Parameters:**

- `party_id` (integer, required): Party ID

**Request Headers:**

```
password: ABC
```

**Success Response (200):**

```json
{
  "bets": [
    {
      "bet_id": 1,
      "party_id": 1,
      "name": "Will it rain tomorrow?",
      "description": "Precipitation in our city on Nov 7th",
      "odds_for_yes": 70,
      "odds_for_no": 30,
      "in_progress": true,
      "outcome": null,
      "user_placement": {
        "has_placed": true,
        "placed_bet_id": 4,
        "amount": 50,
        "decision": "yes",
        "potential_payout": 71.42857142857143,
        "potential_profit": 21.42857142857143
      }
    },
    {
      "bet_id": 2,
      "party_id": 1,
      "name": "Lakers win next game?",
      "description": "Lakers vs Warriors Nov 8th",
      "odds_for_yes": 55,
      "odds_for_no": 45,
      "in_progress": true,
      "outcome": null,
      "user_placement": {
        "has_placed": false
      }
    },
    {
      "bet_id": 3,
      "party_id": 1,
      "name": "Stock market up?",
      "description": "S&P 500 closes higher on Friday",
      "odds_for_yes": 50,
      "odds_for_no": 50,
      "in_progress": false,
      "outcome": "no",
      "user_placement": {
        "has_placed": true,
        "placed_bet_id": 8,
        "amount": 30,
        "decision": "yes",
        "actual_payout": 0,
        "actual_profit": -30,
        "resolved": true
      }
    }
  ]
}
```

**Response Notes:**

- Only shows bets from the specified party
- Bets where user is in `people_involved` are excluded
- For **unresolved** placed bets: includes `potential_payout` and `potential_profit`
- For **resolved** placed bets: includes `actual_payout`, `actual_profit`, and `resolved: true`
- For **not placed** bets: `user_placement.has_placed` is `false`

**Error Responses:**

- `401` - Invalid or missing password
- `403` - Not a party member
- `404` - User or party not found

---

### PUT /api/bets/:id/end?party_id=X

End a bet and process all payouts (party admin only).

**Authentication:** Required (party admin)
**Method:** `PUT`
**URL:** `/api/bets/6/end?party_id=1`

**URL Parameters:**

- `id` (integer): Bet ID

**Query Parameters:**

- `party_id` (integer, required): Party ID

**Request Headers:**

```
password: ABC
Content-Type: application/json
```

**Request Body:**

```json
{
  "outcome": "yes"
}
```

**Request Schema:**

- `outcome` (string, required): Must be `"yes"` or `"no"`

**Success Response (200):**

```json
{
  "bet_id": 6,
  "party_id": 1,
  "name": "Will it rain tomorrow?",
  "in_progress": false,
  "outcome": "yes",
  "payouts": [
    {
      "user_id": 4,
      "user_name": "Alice",
      "amount_bet": 50,
      "decision": "yes",
      "payout": 71.42857142857143,
      "profit": 21.42857142857143
    },
    {
      "user_id": 5,
      "user_name": "Bob",
      "amount_bet": 50,
      "decision": "no",
      "payout": 0,
      "profit": -50
    }
  ]
}
```

**Payout Calculation Formula:**

- **Winners:** `payout = amount_bet × (1 / odds_percentage)`
  - Example: $50 on YES at 70% odds = $50 × (1/0.70) = $71.43
- **Losers:** `payout = 0` (lose entire bet amount)
- **Profit:** `payout - amount_bet`

**What Happens:**

1. Bet is marked as ended (`in_progress: false`)
2. Outcome is recorded
3. Winners receive payouts to their party-specific balance
4. All placed bets are marked as resolved
5. User balances in this party are updated

**Error Responses:**

- `401` - Invalid or missing password
- `403` - Not a party admin
- `404` - Bet not found
- `400` - Bet has already ended
- `400` - Bet does not belong to this party

---

## User Placed Bet Endpoints

**IMPORTANT:** All user placed bet endpoints now require `?party_id=X` query parameter.

### POST /api/user_placed_bets?party_id=X

Place a bet on a specific outcome in a party.

**Authentication:** Required (party member)
**Method:** `POST`
**URL:** `/api/user_placed_bets?party_id=1`

**Query Parameters:**

- `party_id` (integer, required): Party ID

**Request Headers:**

```
password: ABC
Content-Type: application/json
```

**Request Body:**

```json
{
  "user_id": 4,
  "bet_id": 6,
  "amount": 50,
  "decision": "yes"
}
```

**Request Schema:**

- `user_id` (integer, required): User placing the bet
- `bet_id` (integer, required): Bet to place on
- `amount` (number, required): Amount to bet (minimum $1)
- `decision` (string, required): Must be `"yes"` or `"no"`

**Success Response (201):**

```json
{
  "placed_bet_id": 4,
  "user_id": 4,
  "bet_id": 6,
  "amount": 50,
  "decision": "yes",
  "resolved": false,
  "potential_payout": 71.42857142857143,
  "potential_profit": 21.42857142857143,
  "user_money_remaining": 50
}
```

**What Happens:**

1. Bet amount is deducted from user's party-specific balance
2. Placed bet is recorded as unresolved
3. Potential payout is calculated and returned

**Business Rules Checked:**

- User has sufficient funds **in this party**
- Betting is not locked **for this party**
- Bet is still in progress
- Bet belongs to this party
- User is not in `people_involved` array
- Amount is at least $1

**Error Responses:**

- `401` - Invalid or missing password
- `403` - Not a party member
- `400` - Insufficient funds (shows party-specific balance)
- `400` - Cannot place bet - betting is currently locked
- `400` - Cannot bet on this - you are involved in the outcome
- `400` - Cannot place bet - bet has already ended
- `400` - Minimum bet amount is $1
- `400` - Bet does not belong to this party
- `404` - Bet not found

---

### DELETE /api/user_placed_bets/:id?party_id=X

Delete a placed bet and refund the amount to party-specific balance.

**Authentication:** Required (party member)
**Method:** `DELETE`
**URL:** `/api/user_placed_bets/4?party_id=1`

**URL Parameters:**

- `id` (integer): Placed bet ID

**Query Parameters:**

- `party_id` (integer, required): Party ID

**Request Headers:**

```
password: ABC
```

**Success Response (200):**

```json
{
  "message": "Bet removed successfully",
  "placed_bet_id": 4,
  "refunded_amount": 50,
  "user_money_remaining": 100
}
```

**What Happens:**

1. Placed bet is deleted
2. Bet amount is refunded to user's party-specific balance

**Business Rules Checked:**

- Betting is not locked **for this party**
- Placed bet belongs to this party

**Error Responses:**

- `401` - Invalid or missing password
- `403` - Not a party member
- `400` - Cannot remove bet - betting is currently locked
- `400` - Placed bet does not belong to this party
- `404` - Placed bet not found

---

## Settings Endpoints

**IMPORTANT:** Settings are now party-specific. Lock status is per-party, not global.

### GET /api/settings/lock_status?party_id=X

Check if betting is currently locked for a specific party.

**Authentication:** Required (party member)
**Method:** `GET`
**URL:** `/api/settings/lock_status?party_id=1`

**Query Parameters:**

- `party_id` (integer, required): Party ID

**Request Headers:**

```
password: ABC
```

**Success Response (200):**

```json
{
  "bets_locked": false
}
```

**Error Responses:**

- `401` - Invalid or missing password
- `403` - Not a party member
- `404` - Party not found

---

### PUT /api/settings/lock_bets?party_id=X

Lock or unlock betting for a specific party (party admin only).

**Authentication:** Required (party admin)
**Method:** `PUT`
**URL:** `/api/settings/lock_bets?party_id=1`

**Query Parameters:**

- `party_id` (integer, required): Party ID

**Request Headers:**

```
password: ABC
Content-Type: application/json
```

**Request Body:**

```json
{
  "bets_locked": true
}
```

**Request Schema:**

- `bets_locked` (boolean, required): `true` to lock, `false` to unlock

**Success Response (200):**

```json
{
  "bets_locked": true,
  "message": "Betting is now locked. Users cannot create or delete bets."
}
```

**What Happens When Locked (Party-Specific):**

- Users in this party cannot place new bets
- Users in this party cannot delete placed bets
- Admins of this party cannot edit bets
- Admins can still create new bets and end bets
- Other parties are NOT affected

**Error Responses:**

- `401` - Invalid or missing password
- `403` - Not a party admin
- `404` - Party not found

---

## Data Models

### User

```typescript
interface User {
  user_id: number;
  name: string;
  password: string; // 3-character code (A-Z, 0-9)
  membership_tier: "basic" | "vip";
  remaining_hosts: number; // How many parties user can create
  created_at?: Date;
}

// NOTE: admin and money are now party-specific (see PartyMember)
```

### Party

```typescript
interface Party {
  party_id: number;
  name: string;
  description?: string;
  date: Date; // Party date
  join_code: string; // 3 uppercase letters (A-Z)
  locked_status: boolean; // Party-specific lock status
  starting_balance: number; // Default balance for new members
  created_at?: Date;
}
```

### PartyMember

```typescript
interface PartyMember {
  id: number;
  party_id: number;
  user_id: number;
  admin: boolean; // Party-specific admin status
  money: number; // Party-specific available balance
  joined_at?: Date;
}

// NOTE: This replaces the admin and money fields from User model
```

### Bet

```typescript
interface Bet {
  bet_id: number;
  party_id: number; // NEW - Party this bet belongs to
  name: string;
  description: string;
  odds_for_yes: number; // 0-100
  odds_for_no: number; // Calculated: 100 - odds_for_yes
  people_involved: number[]; // Array of user_ids
  in_progress: boolean;
  outcome: "yes" | "no" | null;
  created_at?: Date;
  ended_at?: Date;
}
```

### UserPlacedBet

```typescript
interface UserPlacedBet {
  placed_bet_id: number;
  user_id: number;
  bet_id: number;
  amount: number;
  decision: "yes" | "no";
  resolved: boolean;
  created_at?: Date;
}

// NOTE: party_id is determined through bet_id relationship
```

---

## Frontend Integration Examples

### Example 1: User Registration (Updated)

```javascript
async function registerUser(name) {
  const response = await fetch("http://localhost:3001/api/users/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: name,
      // NOTE: admin field removed
    }),
  });

  const data = await response.json();

  if (response.ok) {
    // Save password and user info
    localStorage.setItem("userPassword", data.password);
    localStorage.setItem("userId", data.user_id);
    localStorage.setItem("membershipTier", data.membership_tier);
    localStorage.setItem("remainingHosts", data.remaining_hosts);
    return data;
  } else {
    throw new Error(data.message);
  }
}
```

### Example 2: Create a Party (NEW)

```javascript
async function createParty(name, description, date, startingBalance, password) {
  const response = await fetch("http://localhost:3001/api/parties", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      password: password,
    },
    body: JSON.stringify({
      name: name,
      description: description,
      date: date, // YYYY-MM-DD format
      starting_balance: startingBalance || 100,
    }),
  });

  const data = await response.json();

  if (response.ok) {
    // Save join code to share with friends
    console.log("Join code:", data.join_code);
    return data;
  } else {
    if (data.message.includes("hosting slots")) {
      alert("You have no remaining hosting slots!");
    }
    throw new Error(data.message);
  }
}
```

### Example 3: Join a Party (NEW)

```javascript
async function joinParty(joinCode, password) {
  const response = await fetch("http://localhost:3001/api/parties/join", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      password: password,
    },
    body: JSON.stringify({
      join_code: joinCode.toUpperCase(),
    }),
  });

  const data = await response.json();

  if (response.ok) {
    // Set this as current party
    localStorage.setItem("currentPartyId", data.party_id);
    return data;
  } else {
    throw new Error(data.message);
  }
}
```

### Example 4: Get User's Parties (NEW)

```javascript
async function getUserParties(password) {
  const response = await fetch("http://localhost:3001/api/parties", {
    headers: {
      password: password,
    },
  });

  const data = await response.json();

  if (response.ok) {
    return data.parties;
  } else {
    throw new Error(data.message);
  }
}
```

### Example 5: Get Party Leaderboard (Replaces GET /users)

```javascript
async function getPartyLeaderboard(partyId, password) {
  const response = await fetch(
    `http://localhost:3001/api/parties/${partyId}/members`,
    {
      headers: {
        password: password,
      },
    }
  );

  const data = await response.json();

  if (response.ok) {
    // Members are already sorted by total_money descending
    return data.members;
  } else {
    if (data.statusCode === 403) {
      alert("You are not a member of this party!");
    }
    throw new Error(data.message);
  }
}
```

### Example 6: Get User's Bets (Updated with party_id)

```javascript
async function getUserBets(userId, partyId, password) {
  const response = await fetch(
    `http://localhost:3001/api/bets/user/${userId}?party_id=${partyId}`,
    {
      headers: {
        password: password,
      },
    }
  );

  const data = await response.json();

  if (response.ok) {
    return data.bets;
  } else {
    throw new Error(data.message);
  }
}
```

### Example 7: Place a Bet (Updated with party_id)

```javascript
async function placeBet(userId, betId, amount, decision, partyId, password) {
  const response = await fetch(
    `http://localhost:3001/api/user_placed_bets?party_id=${partyId}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        password: password,
      },
      body: JSON.stringify({
        user_id: userId,
        bet_id: betId,
        amount: amount,
        decision: decision, // "yes" or "no"
      }),
    }
  );

  const data = await response.json();

  if (response.ok) {
    return data;
  } else {
    // Handle specific errors
    if (data.message.includes("Insufficient funds")) {
      alert("Not enough money in this party!");
    } else if (data.message.includes("locked")) {
      alert("Betting is currently locked for this party");
    } else if (data.message.includes("does not belong")) {
      alert("This bet is not part of the current party!");
    }
    throw new Error(data.message);
  }
}
```

### Example 8: Create Bet (Updated with party_id)

```javascript
async function createBet(
  name,
  description,
  oddsForYes,
  peopleInvolved,
  partyId,
  adminPassword
) {
  const response = await fetch(
    `http://localhost:3001/api/bets?party_id=${partyId}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        password: adminPassword,
      },
      body: JSON.stringify({
        name: name,
        description: description,
        odds_for_yes: oddsForYes,
        people_involved: peopleInvolved || [],
      }),
    }
  );

  const data = await response.json();

  if (response.ok) {
    return data;
  } else {
    if (data.statusCode === 403) {
      alert("You must be a party admin to create bets!");
    }
    throw new Error(data.message);
  }
}
```

### Example 9: End Bet (Updated with party_id)

```javascript
async function endBet(betId, outcome, partyId, adminPassword) {
  const response = await fetch(
    `http://localhost:3001/api/bets/${betId}/end?party_id=${partyId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        password: adminPassword,
      },
      body: JSON.stringify({
        outcome: outcome, // "yes" or "no"
      }),
    }
  );

  const data = await response.json();

  if (response.ok) {
    // Show payout results
    console.log("Payouts:", data.payouts);
    return data;
  } else {
    throw new Error(data.message);
  }
}
```

### Example 10: Lock/Unlock Betting (Updated with party_id)

```javascript
async function toggleBettingLock(partyId, shouldLock, adminPassword) {
  const response = await fetch(
    `http://localhost:3001/api/settings/lock_bets?party_id=${partyId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        password: adminPassword,
      },
      body: JSON.stringify({
        bets_locked: shouldLock,
      }),
    }
  );

  const data = await response.json();

  if (response.ok) {
    console.log(data.message);
    return data;
  } else {
    if (data.statusCode === 403) {
      alert("You must be a party admin to lock/unlock betting!");
    }
    throw new Error(data.message);
  }
}
```

---

## Before/After Comparison

### Creating a Bet

**Before (v1.0):**

```javascript
// OLD - No party context
fetch("http://localhost:3001/api/bets", {
  method: "POST",
  headers: {
    password: adminPassword,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    name: "Will it rain?",
    description: "Tomorrow's weather",
    odds_for_yes: 70,
  }),
});
```

**After (v2.0):**

```javascript
// NEW - Party context required
const partyId = localStorage.getItem("currentPartyId");
fetch(`http://localhost:3001/api/bets?party_id=${partyId}`, {
  method: "POST",
  headers: {
    password: adminPassword,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    name: "Will it rain?",
    description: "Tomorrow's weather",
    odds_for_yes: 70,
  }),
});
```

### Getting Leaderboard

**Before (v1.0):**

```javascript
// OLD - Global leaderboard
fetch("http://localhost:3001/api/users", {
  headers: { password: password },
});
// Returns all users with money field
```

**After (v2.0):**

```javascript
// NEW - Party-specific leaderboard
const partyId = localStorage.getItem("currentPartyId");
fetch(`http://localhost:3001/api/parties/${partyId}/members`, {
  headers: { password: password },
});
// Returns members with party-specific money
```

### User Login Response

**Before (v1.0):**

```json
{
  "user_id": 1,
  "name": "Alice",
  "admin": false,
  "money": 100
}
```

**After (v2.0):**

```json
{
  "user_id": 1,
  "name": "Alice",
  "membership_tier": "basic",
  "remaining_hosts": 1
}
```

---

## Quick Reference

### Base URL

```
http://localhost:3001/api
```

### Authentication Header

```
password: ABC
```

### Content Type (for POST/PUT)

```
Content-Type: application/json
```

### Endpoint Quick List

**Public:**

- `POST /users/register` - Register new user
- `POST /users/login` - Login user

**Party Management (Auth Required):**

- `POST /parties` - Create party
- `GET /parties` - Get user's parties
- `POST /parties/join` - Join party with code
- `GET /parties/:party_id` - Get party details
- `GET /parties/:party_id/members` - Get party leaderboard
- `PUT /parties/:party_id` - Update party (admin)
- `DELETE /parties/:party_id` - Delete party (admin)
- `POST /parties/:party_id/members` - Add member (admin)
- `PUT /parties/:party_id/members/:user_id` - Update member (admin)
- `DELETE /parties/:party_id/members/:user_id` - Remove member (admin)

**User (Auth Required):**

- `GET /users/:id` - Get user by ID
- `GET /bets/user/:user_id?party_id=X` - Get user's bets (party member)
- `POST /user_placed_bets?party_id=X` - Place bet (party member)
- `DELETE /user_placed_bets/:id?party_id=X` - Remove bet (party member)
- `GET /settings/lock_status?party_id=X` - Check if locked (party member)

**Party Admin (Auth + Party Admin Required):**

- `POST /bets?party_id=X` - Create bet
- `PUT /bets/:id?party_id=X` - Update bet
- `DELETE /bets/:id?party_id=X` - Delete bet
- `PUT /bets/:id/end?party_id=X` - End bet
- `PUT /settings/lock_bets?party_id=X` - Lock/unlock betting

---

**Last Updated:** 2025-12-17 (v2.0 - Multi-Party Migration)
**Breaking Changes:** See top of document
**Contact:** For issues or questions, refer to backend repository documentation
