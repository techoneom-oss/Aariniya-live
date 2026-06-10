# Review Report: Database and Backend Core (Milestone 1)

## Review Summary

**Verdict**: REQUEST_CHANGES

The database and backend core implementation of Milestone 1 provides basic functionality, seeds tables correctly, protects admin routes via JWT authentication, and passes the basic integration tests. However, several critical and major security and logic vulnerabilities were discovered during our quality and adversarial review. Most notably, verify payment requests for non-existent order IDs respond with a success status (HTTP 200) instead of failing, and the checkout API delegates total price computation and user identification to the client body without backend validation, enabling price manipulation and unauthorized user ordering.

---

## Quality Review Findings

### [Critical] Finding 1: Silent Success on Non-Existent Order ID Verification
- **What**: The payment verification API `/api/orders/verify` returns a success status (`status: 'success'`) and HTTP 200 even when a non-existent `razorpay_order_id` is supplied in the request body.
- **Where**: `backend/server.js`, lines 320-341 (Mock verification) and lines 350-372 (Real verification).
- **Why**: When querying the database for the order:
  `db.get('SELECT * FROM orders WHERE razorpay_order_id = ?', [razorpay_order_id], (orderErr, order) => { ... })`
  if the order does not exist, `order` is returned as `undefined`. Instead of returning a 404 or 400 error, the route proceeds to call `processReceiptAndInventory(order, callback)`. Inside `processReceiptAndInventory`, the accesses to `order.items` and `order.address` throw `TypeError`s, but because they are wrapped in `try/catch` blocks, they are caught silently, leaving items and address empty. It then writes no receipt (which also fails silently via catch) and calls the callback to return a success response to the client. This allows any arbitrary verify payload to appear "successful".
- **Suggestion**: In `/api/orders/verify`, verify that `order` is defined before calling `processReceiptAndInventory`. If `order` is undefined, return `404 Not Found` (or `400 Bad Request`). For example:
  ```javascript
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  ```

### [Major] Finding 2: Client-Side Price & Amount Trust (Price Manipulation)
- **What**: The checkout API `POST /api/orders/create` trusts the client-provided `amount` instead of calculating the expected total on the backend using the database product prices and the order item quantities.
- **Where**: `backend/server.js`, lines 247-309.
- **Why**: An attacker can send a request with expensive items (e.g. products or courses worth 10,000 INR) but specify `amount: 1` in the request body. The server will create a Razorpay order for 1 INR, which will be verified successfully upon payment. The order is then saved and marked as paid in the database and stock is decremented, even though the merchant only received 1 INR.
- **Suggestion**: The backend must query the database for the price of each item in `items`, calculate the expected total, compare it with the client-supplied `amount` (or calculate the amount directly on the server to prevent tamper), and reject the order if they do not match.

### [Major] Finding 3: Unauthenticated Checkout and Spoofed User IDs
- **What**: The checkout API `POST /api/orders/create` does not require user authentication (it is not protected by the `authenticateToken` middleware), and accepts an optional `user_id` parameter directly in the request body.
- **Where**: `backend/server.js`, lines 247-248.
- **Why**: Since the endpoint is unprotected, any user (or guest) can specify any existing user's ID in the `user_id` field. The order will be linked to that user's account in the database without their consent or authentication, allowing unauthorized order association and data injection.
- **Suggestion**: If guest checkout is supported, ensure that if a `user_id` is supplied, it is validated against the authenticated user token (require `authenticateToken` if `user_id` is provided, or extract `req.user.id` directly if token is present).

### [Major] Finding 4: Lack of Stock Sufficiency Checks (Overselling Risk)
- **What**: The backend decrements stock on payment verification without verifying if there is sufficient stock remaining.
- **Where**: `backend/server.js`, lines 630-634.
- **Why**: The decrement query uses a `CASE WHEN inventory - qty < 0 THEN 0 ELSE inventory - qty END` constraint to cap inventory at 0. However, the order is accepted and marked as paid anyway, resulting in overselling.
- **Suggestion**: Check product inventory at checkout creation time or check it during verification before marking the payment as verified. If inventory is insufficient, the checkout should be blocked or handled as out-of-stock.

### [Major] Finding 5: No Transaction Rollback and Unhandled Stock Update Failures
- **What**: The stock update queries inside `processReceiptAndInventory` are executed asynchronously in a loop without being wrapped in a SQL transaction, and errors do not prevent receipt writing or return error responses.
- **Where**: `backend/server.js`, lines 626-648.
- **Why**: If a product inventory update fails, the server logs a console error but still increments `completedUpdates` and proceeds to generate a receipt, marking the payment as fully successful. Leaving updates un-rolled-back can result in corrupt/inconsistent database states.
- **Suggestion**: Wrap all inventory updates inside a database transaction (`BEGIN TRANSACTION` and `COMMIT` or `ROLLBACK`). If any update fails, roll back the transaction and return an error.

---

## Verified Claims

- **Users table schema migration & seed** → verified via database inspection and `test_verification.js` → **PASS**
- **Courses table schema migration & seed** → verified via database inspection and `test_verification.js` → **PASS**
- **Admin check middleware (`isAdmin`)** → verified via code inspection and `test_verification.js` → **PASS**
- **Admin dashboard stats endpoint access restriction** → verified via `test_verification.js` (unauthorized user returns 403) → **PASS**
- **Product inventory admin update** → verified via `test_verification.js` → **PASS**
- **Course enrollment status admin update** → verified via `test_verification.js` → **PASS**
- **Mock payment verification & inventory decrement (happy path)** → verified via `test_verification.js` → **PASS**
- **Receipt writing (happy path)** → verified via file existence check of HTML/TXT files → **PASS**

---

## Coverage Gaps
- **Concurrent DB writes under load** — risk level: **Medium** — recommendation: Accept risk for sqlite development environment, but document for production (consider SQLite write-ahead logging (WAL) mode).
- **Payment failure cleanup** — risk level: **Low** — recommendation: Implement automated cleanups for orders that remain in `pending` status indefinitely.

---

## Unverified Items
- **Real Razorpay payment gateway verification** — reason not verified: Requires real API keys. Checked mock mode, which mirrors the routing logic.

---

## Adversarial Challenge Report

## Challenge Summary

**Overall risk assessment**: HIGH

While the core functionality works under happy-path test conditions, the backend does not withstand basic adversarial inputs (price manipulation, fake order IDs, unauthenticated user spoofing, negative quantities).

## Challenges

### [Critical] Challenge 1: Empty/Undetected Order crash bypass
- **Assumption challenged**: Verified order objects returned by `db.get` are always valid orders.
- **Attack scenario**: Sending an unauthenticated POST request to `/api/orders/verify` with `razorpay_order_id: 'order_mock_nonexistent'`.
- **Blast radius**: The API succeeds and returns 200, bypassing authentication and payment logic, leading to inconsistent app states where payments are successfully registered for non-existent orders.
- **Mitigation**: Add a null check for `order` immediately after the `db.get` call.

### [High] Challenge 2: Price Manipulation
- **Assumption challenged**: The client-side calculates order totals honestly.
- **Attack scenario**: Intercepting the `POST /api/orders/create` payload and changing `amount` from `4397` to `1`.
- **Blast radius**: Attacker gets goods worth `4397` INR for `1` INR.
- **Mitigation**: Calculate the correct total amount on the server side using the database price list.

### [High] Challenge 3: Negative Quantities (Inventory Inflation)
- **Assumption challenged**: Quantities in `items` are always positive numbers.
- **Attack scenario**: Passing `qty: -50` for a physical item in `items` array during checkout.
- **Blast radius**: During payment verification, `inventory - (-50)` resolves to `inventory + 50`, effectively increasing the inventory of that product on payment verification.
- **Mitigation**: Add input validation to ensure all item quantities are positive integers greater than 0.

### [Medium] Challenge 4: User Spoofing
- **Assumption challenged**: The user_id passed during checkout belongs to the user currently making the request.
- **Attack scenario**: An unauthenticated guest or malicious user specifies `user_id: 1` (Admin) in the checkout request.
- **Blast radius**: Orders are associated with other users' profiles, contaminating their order histories.
- **Mitigation**: Verify the token and match the user ID if a user ID is specified.

## Stress Test Results

- **Verify payment for nonexistent order** → should fail with 404/400 → **FAIL** (responded with success 200)
- **Place order with custom arbitrary price** → should fail with price mismatch → **FAIL** (allowed arbitrary price setup)
- **Place order with negative quantity** → should fail validation → **FAIL** (accepted negative quantity without validation)
