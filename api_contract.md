# Kalshi Lite - API Contract

**Version:** 1.0
**Base URL:** `http://localhost:3001/api`
**Environment:** Development

---

## Table of Contents

1. [Authentication](#authentication)
2. [Error Handling](#error-handling)
3. [User Endpoints](#user-endpoints)
4. [Bet Endpoints](#bet-endpoints)
5. [User Placed Bet Endpoints](#user-placed-bet-endpoints)
6. [Settings Endpoints](#settings-endpoints)
7. [Data Models](#data-models)

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
fetch("http://localhost:3001/api/users", {
  headers: {
    password: "ABC",
    "Content-Type": "application/json",
  },
});

// Axios
axios.get("http://localhost:3001/api/users", {
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

### Admin-Only Endpoints

These endpoints require authentication AND the user must have `admin: true`:

- `POST /api/bets` - Create bet
- `PUT /api/bets/:id` - Update bet
- `DELETE /api/bets/:id` - Delete bet
- `PUT /api/bets/:id/end` - End bet
- `PUT /api/settings/lock_bets` - Lock/unlock betting

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

| Code | Meaning               | Common Scenarios                                           |
| ---- | --------------------- | ---------------------------------------------------------- |
| 200  | OK                    | Successful GET, PUT, DELETE                                |
| 201  | Created               | Successful POST (resource created)                         |
| 400  | Bad Request           | Invalid input, validation errors, business rule violations |
| 401  | Unauthorized          | Missing or invalid password                                |
| 403  | Forbidden             | Non-admin trying to access admin endpoint                  |
| 404  | Not Found             | Resource doesn't exist                                     |
| 500  | Internal Server Error | Server-side error                                          |

### Common Error Messages

| Error                                                           | Meaning                              |
| --------------------------------------------------------------- | ------------------------------------ |
| `"Authentication required. Please provide password in header."` | Missing password header              |
| `"Invalid password"`                                            | Password doesn't match any user      |
| `"Admin access required"`                                       | Non-admin user trying admin endpoint |
| `"Insufficient funds. Available: $X, Required: $Y"`             | User doesn't have enough money       |
| `"Cannot place bet - betting is currently locked"`              | Admin has locked all betting         |
| `"Cannot bet on this - you are involved in the outcome"`        | User is in `people_involved` array   |

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
  "name": "Alice",
  "admin": false
}
```

**Request Schema:**

- `name` (string, required): 1-100 characters
- `admin` (boolean, optional): Default `false`

**Success Response (201):**

```json
{
  "user_id": 4,
  "name": "Alice",
  "password": "HCO",
  "admin": false,
  "money": 100
}
```

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
  "admin": false,
  "money": 100
}
```

**Error Responses:**

- `401` - Invalid password
- `400` - Password format invalid

---

### GET /api/users

Get all users with their current balances (for leaderboard).

**Authentication:** Required
**Method:** `GET`
**URL:** `/api/users`

**Request Headers:**

```
password: ABC
```

**Success Response (200):**

```json
{
  "users": [
    {
      "user_id": 2,
      "name": "Admin User",
      "money": 116.36,
      "total_money": 116.36
    },
    {
      "user_id": 1,
      "name": "Test User",
      "money": 90,
      "total_money": 100
    }
  ]
}
```

**Response Fields:**

- `money` (number): Available cash (not invested in active bets)
- `total_money` (number): `money` + money invested in active bets
- Users are sorted by `total_money` descending (highest first)

**Error Responses:**

- `401` - Invalid or missing password

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
  "money": 121.43,
  "admin": false
}
```

**Error Responses:**

- `401` - Invalid or missing password
- `404` - User not found

---

## Bet Endpoints

### POST /api/bets

Create a new bet (admin only).

**Authentication:** Required (Admin)
**Method:** `POST`
**URL:** `/api/bets`

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
- `people_involved` (array of integers, optional): User IDs involved in the bet outcome. Default `[]`

**Success Response (201):**

```json
{
  "bet_id": 6,
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

**Error Responses:**

- `401` - Invalid or missing password
- `403` - User is not admin
- `400` - Validation error

---

### PUT /api/bets/:id

Update bet metadata (admin only). Cannot update if bets are locked.

**Authentication:** Required (Admin)
**Method:** `PUT`
**URL:** `/api/bets/:id`

**URL Parameters:**

- `id` (integer): Bet ID

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
- `403` - User is not admin
- `404` - Bet not found
- `400` - Cannot edit bet - bets are locked

---

### DELETE /api/bets/:id

Delete a bet (admin only). If users have placed bets, they will be refunded automatically.

**Authentication:** Required (Admin)
**Method:** `DELETE`
**URL:** `/api/bets/:id`

**URL Parameters:**

- `id` (integer): Bet ID

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
- `403` - User is not admin
- `404` - Bet not found

---

### GET /api/bets/user/:user_id

Get all bets relevant to a specific user or admin, excluding bets where they are involved in the outcome.

Returns all bets with the user's placement status (placed/not placed, resolved/unresolved).

**Authentication:** Required
**Method:** `GET`
**URL:** `/api/bets/user/:user_id`

**URL Parameters:**

- `user_id` (integer): User ID

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

- Bets where user is in `people_involved` are excluded
- For **unresolved** placed bets: includes `potential_payout` and `potential_profit`
- For **resolved** placed bets: includes `actual_payout`, `actual_profit`, and `resolved: true`
- For **not placed** bets: `user_placement.has_placed` is `false`

**Error Responses:**

- `401` - Invalid or missing password
- `404` - User not found

---

### PUT /api/bets/:id/end

End a bet and process all payouts (admin only).

**Authentication:** Required (Admin)
**Method:** `PUT`
**URL:** `/api/bets/:id/end`

**URL Parameters:**

- `id` (integer): Bet ID

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
3. Winners receive payouts to their available balance
4. All placed bets are marked as resolved
5. User balances are updated

**Error Responses:**

- `401` - Invalid or missing password
- `403` - User is not admin
- `404` - Bet not found
- `400` - Bet has already ended

---

## User Placed Bet Endpoints

### POST /api/user_placed_bets

Place a bet on a specific outcome.

**Authentication:** Required
**Method:** `POST`
**URL:** `/api/user_placed_bets`

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

1. Bet amount is deducted from user's available balance
2. Placed bet is recorded as unresolved
3. Potential payout is calculated and returned

**Business Rules Checked:**

- User has sufficient funds
- Betting is not locked
- Bet is still in progress
- User is not in `people_involved` array
- Amount is at least $1

**Error Responses:**

- `401` - Invalid or missing password
- `400` - Insufficient funds
- `400` - Cannot place bet - betting is currently locked
- `400` - Cannot bet on this - you are involved in the outcome
- `400` - Cannot place bet - bet has already ended
- `400` - Minimum bet amount is $1
- `404` - Bet not found

---

### DELETE /api/user_placed_bets/:id

Delete a placed bet and refund the amount (only allowed when bets are not locked).

**Authentication:** Required
**Method:** `DELETE`
**URL:** `/api/user_placed_bets/:id`

**URL Parameters:**

- `id` (integer): Placed bet ID

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
2. Bet amount is refunded to user's available balance

**Error Responses:**

- `401` - Invalid or missing password
- `400` - Cannot remove bet - betting is currently locked
- `404` - Placed bet not found

---

## Settings Endpoints

### GET /api/settings/lock_status

Check if betting is currently locked.

**Authentication:** Required
**Method:** `GET`
**URL:** `/api/settings/lock_status`

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

---

### PUT /api/settings/lock_bets

Lock or unlock betting globally (admin only).

**Authentication:** Required (Admin)
**Method:** `PUT`
**URL:** `/api/settings/lock_bets`

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

**What Happens When Locked:**

- Users cannot place new bets
- Users cannot delete placed bets
- Admins cannot edit bets
- Admins can still create new bets and end bets

**Error Responses:**

- `401` - Invalid or missing password
- `403` - User is not admin

---

## Data Models

### User

```typescript
interface User {
  user_id: number;
  name: string;
  password: string; // 3-character code (A-Z, 0-9)
  admin: boolean;
  money: number; // Available balance
  created_at?: Date;
}
```

### Bet

```typescript
interface Bet {
  bet_id: number;
  name: string;
  description: string;
  odds_for_yes: number; // 0-100
  odds_for_no: number; // Calculated: 100 - odds_for_yes
  people_involved: number[]; // Array of user_ids
  in_progress: boolean;
  outcome: "yes" | "no" | null;
  created_at?: Date;
  updated_at?: Date;
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
```

### Settings

```typescript
interface Settings {
  id: number; // Always 1 (single row)
  bets_locked: boolean;
  created_at?: Date;
  updated_at?: Date;
}
```

---

## Frontend Integration Examples

### Example 1: User Registration

```javascript
async function registerUser(name, isAdmin = false) {
  const response = await fetch("http://localhost:3001/api/users/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: name,
      admin: isAdmin,
    }),
  });

  const data = await response.json();

  if (response.ok) {
    // Save password for future requests
    localStorage.setItem("userPassword", data.password);
    localStorage.setItem("userId", data.user_id);
    return data;
  } else {
    throw new Error(data.message);
  }
}
```

### Example 2: Get User's Bets

```javascript
async function getUserBets(userId, password) {
  const response = await fetch(
    `http://localhost:3001/api/bets/user/${userId}`,
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

### Example 3: Place a Bet

```javascript
async function placeBet(userId, betId, amount, decision, password) {
  const response = await fetch("http://localhost:3001/api/user_placed_bets", {
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
  });

  const data = await response.json();

  if (response.ok) {
    return data;
  } else {
    // Handle specific errors
    if (data.message.includes("Insufficient funds")) {
      alert("Not enough money!");
    } else if (data.message.includes("locked")) {
      alert("Betting is currently locked by admin");
    }
    throw new Error(data.message);
  }
}
```

### Example 4: Get Leaderboard

```javascript
async function getLeaderboard(password) {
  const response = await fetch("http://localhost:3001/api/users", {
    headers: {
      password: password,
    },
  });

  const data = await response.json();

  if (response.ok) {
    // Users are already sorted by total_money descending
    return data.users;
  } else {
    throw new Error(data.message);
  }
}
```

### Example 5: End Bet (Admin)

```javascript
async function endBet(betId, outcome, adminPassword) {
  const response = await fetch(`http://localhost:3001/api/bets/${betId}/end`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      password: adminPassword,
    },
    body: JSON.stringify({
      outcome: outcome, // "yes" or "no"
    }),
  });

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

**User (Auth Required):**

- `GET /users` - Get all users (leaderboard)
- `GET /users/:id` - Get user by ID
- `GET /bets/user/:user_id` - Get user's bets
- `POST /user_placed_bets` - Place bet
- `DELETE /user_placed_bets/:id` - Remove bet
- `GET /settings/lock_status` - Check if locked

**Admin (Auth + Admin Required):**

- `POST /bets` - Create bet
- `PUT /bets/:id` - Update bet
- `DELETE /bets/:id` - Delete bet
- `PUT /bets/:id/end` - End bet
- `PUT /settings/lock_bets` - Lock/unlock betting

---

**Last Updated:** 2025-11-08
**Contact:** For issues or questions, refer to backend repository documentation
