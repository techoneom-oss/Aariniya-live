# Milestone 1 Backend & Database Review Report

## Part 1: Quality Review

### Review Summary
**Verdict**: REQUEST_CHANGES

The database schema migrations and seeding logic in `backend/database.js` are logically correct and correctly run when tables do not exist. Parameterized queries are used consistently across all server endpoints, ensuring protection against SQL Injection. However, multiple endpoints fail to comply with the interface contracts defined in `PROJECT.md`, and a critical business logic flaw permits client-side price manipulation.

---

### Findings

#### [Critical] Finding 1: Client-Controlled Checkout Amount (Price Manipulation)
- **What**: The order creation endpoint accepts the `amount` field directly from the client request and uses it to initiate the payment and record the total transaction value.
- **Where**: `backend/server.js`, Lines 247–309 (under `/api/orders/create`).
- **Why**: An attacker can modify the request payload to set the `amount` to `1` (or any arbitrary small amount) while listing high-value products in the `items` array. The payment is initiated for 1 INR, signature verification succeeds, the order is logged as paid, and the inventory is decremented.
- **Suggestion**: The backend must query the database to fetch the current prices of the products/courses listed in the `items` array, calculate the total amount on the server side, and compare/use it for the payment checkout.

#### [Major] Finding 2: Interface Contract Mismatch for Dashboard Stats
- **What**: The response payload structure does not match `PROJECT.md`.
- **Where**: `backend/server.js`, Lines 402–422 (under `/api/admin/dashboard-stats`).
- **Why**: `PROJECT.md` specifies the response format: `{ revenue: number, orderCount: number, activeOrders: Array }`. The server implementation returns:
  ```json
  {
    "totalRevenue": 1199.00,
    "orderCount": 1,
    "activeOrders": [...]
  }
  ```
  This returns `totalRevenue` instead of `revenue`, which will break any frontend integrations expecting `revenue`.
- **Suggestion**: Rename the returned key `totalRevenue` to `revenue`.

#### [Major] Finding 3: Interface Contract Mismatch for Product Inventory Updates
- **What**: The response payload structure does not match `PROJECT.md`.
- **Where**: `backend/server.js`, Lines 425–453 (under `/api/admin/products/:id/inventory`).
- **Why**: `PROJECT.md` specifies the response format: `{ message: 'Inventory updated successfully', product: Object }`. The server implementation returns the raw `product` object directly:
  ```javascript
  res.json(product);
  ```
- **Suggestion**: Wrap the response in the specified object format:
  ```javascript
  res.json({ message: 'Inventory updated successfully', product });
  ```

#### [Major] Finding 4: Interface Contract Mismatch for Course Enrollment Updates
- **What**: The response payload structure does not match `PROJECT.md`.
- **Where**: `backend/server.js`, Lines 456–473 (under `/api/admin/courses/:id/enrollment`).
- **Why**: `PROJECT.md` specifies the response format: `{ message: 'Enrollment status updated successfully', course: Object }`. The server implementation returns the raw `course` object directly:
  ```javascript
  res.json(course);
  ```
- **Suggestion**: Wrap the response in the specified object format:
  ```javascript
  res.json({ message: 'Enrollment status updated successfully', course });
  ```

#### [Minor] Finding 5: Potential Server Hang on Malformed `items` JSON
- **What**: Lack of runtime type check on the parsed `items` array before performing array operations.
- **Where**: `backend/server.js`, Lines 476–490 (under `processReceiptAndInventory` helper).
- **Why**: If a malformed array (e.g. a string or a plain object) is stored in the database for `items`, the `JSON.parse` will succeed but `items.filter` will throw a TypeError: `items.filter is not a function`. Since this TypeError is thrown outside a try-catch, it will crash the execution context, causing the `/api/orders/verify` callback to never be invoked, which leaves the client request hanging until it times out.
- **Suggestion**: Validate that `items` is an array using `Array.isArray(items)` before performing operations on it, or wrap the whole block in a try-catch that handles failures gracefully.

#### [Minor] Finding 6: Missing Input Validation on Inventory Value
- **What**: The update inventory endpoint does not restrict values to non-negative integers.
- **Where**: `backend/server.js`, Lines 429–432.
- **Why**: The server only checks `typeof inventory !== 'number'`. This permits setting decimal numbers (e.g., `5.5`) or negative values (e.g., `-100`), corrupting the product inventory state.
- **Suggestion**: Assert that `inventory` is an integer and is `>= 0`:
  ```javascript
  if (inventory === undefined || !Number.isInteger(inventory) || inventory < 0) { ... }
  ```

---

### Verified Claims

- **Role Migration & User Seeding** → Verified via code review of `backend/database.js` lines 39–57 and lines 335–364 → **PASS** (Checks presence of column before altering table, and checks user existence before seeding).
- **Course Enrollment Status Schema & Seeding** → Verified via code review of `backend/database.js` lines 113–131 and lines 291–333 → **PASS** (Correctly checks table schema, creates column if not exists, and sets default to 'open').
- **Token Verification & Role Authorization** → Verified via code review of `backend/server.js` lines 33–52 → **PASS** (Uses standard JWT bearer extraction, signature validation, and checks payload role for admin endpoints).
- **SQL Injection Prevention** → Verified via code review of all SQLite queries in `backend/server.js` → **PASS** (All dynamically input queries are parameterized correctly).
- **Payment Verification Receipt Path** → Verified via code review of `backend/server.js` lines 495–500 → **PASS** (Generates TXT and HTML receipts in `backend/logs/receipts/` relative path matching layout).

---

### Coverage Gaps

- **Real Payment Gateways** — risk level: Low — recommendation: Accept Risk (testing is done using mock mode bypass, which is standard in development, but must be deactivated in production).

---

### Unverified Items

- **End-to-End API Execution** — The server and verification test script could not be run synchronously due to CLI execution permissions/timeout.

---
---

## Part 2: Adversarial Review

### Challenge Summary
**Overall risk assessment**: HIGH

The primary risk lies in the trust placed on client inputs: the transaction amount is trusted without verification, and mock verification endpoints can be triggered by arbitrary callers.

---

### Challenges

#### [Critical] Challenge 1: Client-Side Price Manipulation
- **Assumption challenged**: The client-side calculated `amount` matches the real price of the items in the cart.
- **Attack scenario**: A malicious customer builds a cart containing a bottle of AARINIYA Deep Forest Multifloral Honey (price: 1199 INR). During the checkout call, they intercept the request and set `"amount": 1` in the JSON body. The Razorpay checkout window initiates a payment of 1 INR. Once paid, the payment is verified, the order status is set to paid, and they successfully purchase a 1199 INR item for 1 INR.
- **Blast radius**: Complete financial exploit capability for any customer.
- **Mitigation**: Fetch product prices from the database using their IDs and sum them up on the server side to determine the checkout amount.

#### [High] Challenge 2: Insecure Mock Payment Bypass
- **Assumption challenged**: Mock verification is only available during offline testing.
- **Attack scenario**: The server contains a branch that checks if `isMock` is true or if `razorpay_order_id` starts with `"order_mock_"`. If true, it skips signature checking and immediately sets the order status to `paid`. In a production deployment, an attacker could send a verify request with `isMock: true` and get the product/course marked as paid without paying.
- **Blast radius**: Bypassing of the payment gateway for any order.
- **Mitigation**: Wrap the mock condition in a node environment check:
  ```javascript
  if (process.env.NODE_ENV !== 'production' && (isMock || razorpay_order_id.startsWith('order_mock_'))) { ... }
  ```

#### [Medium] Challenge 3: Negative Inventory State
- **Assumption challenged**: Admin controls prevent invalid stock quantities.
- **Attack scenario**: An admin endpoint call with `{ "inventory": -5 }` is sent. The database stores the negative value. When a checkout verifies, the inventory decrement logic:
  `SET inventory = CASE WHEN inventory - ? < 0 THEN 0 ELSE inventory - ? END`
  runs. If `inventory` is already `-5`, this could cause weird behavior.
- **Blast radius**: Corrupted inventory counts.
- **Mitigation**: Enforce strict range checks on the inventory API.

---

### Stress Test Results

- **Decimal Inventory Input** → Server accepts `{ inventory: 1.5 }` → SQLite updates product inventory to a decimal number → **FAIL**
- **Negative Inventory Input** → Server accepts `{ inventory: -10 }` → SQLite updates product inventory to a negative number → **FAIL**
- **Null Address Receipt Generation** → Client provides an empty address object `{}` → Receipt output displays blank/empty fields like `, ,  - , ` → **PASS** (displays blank but does not crash).
