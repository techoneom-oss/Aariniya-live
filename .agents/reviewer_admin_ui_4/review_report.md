# Review Report: Milestone 2 Implementation Review

## Review Summary
**Verdict**: REQUEST_CHANGES

The Milestone 2 implementation introduces a comprehensive Frontend Admin UI and backend security updates. However, during detailed code review, multiple integration defects were discovered between the frontend client and backend APIs that prevent the checkout process from completing successfully in the browser. 

---

## Findings

### [Critical] Finding 1: Missing Authorization Header in Frontend Checkout Request
- **What**: The frontend checkout form submits orders to the backend without including the necessary JWT Bearer token in the request headers.
- **Where**: `frontend/src/components/CartDrawer.jsx` (Lines 70–75)
- **Why**: The backend API endpoint `POST /api/orders/create` is protected by `authenticateToken` middleware and expects an `Authorization: Bearer <token>` header. Since `CartDrawer.jsx` does not include this header, any checkout attempt by logged-in or guest users fails with an HTTP `401 Access token required` response, blocking order placement.
- **Suggestion**: Update `CartDrawer.jsx` inside `handleCheckoutSubmit` to retrieve the token from `localStorage` and include it in the headers:
  ```javascript
  const token = localStorage.getItem('aariniya_token');
  const res = await fetch('http://localhost:5000/api/orders/create', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(checkoutData)
  });
  ```

### [Major] Finding 2: Address Field Format Mismatch (String vs Object)
- **What**: The frontend sends the `address` field as a single formatted string, whereas the backend database storage, receipt generation, and UI screens expect a JSON object.
- **Where**: 
  - `frontend/src/components/CartDrawer.jsx` (Lines 56, 64)
  - `backend/server.js` (Lines 571, 612)
  - `frontend/src/pages/AdminDashboard.jsx` (Line 238)
  - `frontend/src/pages/Profile.jsx` (Line 275)
- **Why**: 
  - `CartDrawer.jsx` concatenates the form input into `addressString` and sends it as `address: addressString`.
  - The backend stores this as a double-serialized string (because it applies `JSON.stringify(address)`).
  - When the backend or UI parses `o.address`, it gets a flat string. Accessing properties like `address_line1`, `city`, etc., returns `undefined`, which corrupts receipts and dashboards to render as `, , ,  - , `.
- **Suggestion**: Modify `CartDrawer.jsx` to send the `address` object directly to the backend instead of formatting it as a string:
  ```javascript
  const checkoutData = {
    amount: totalAmount,
    currency: 'INR',
    customer_name: formData.name,
    email: formData.email,
    phone: formData.phone,
    address: {
      address_line1: formData.address_line1,
      address_line2: formData.address_line2,
      city: formData.city,
      state: formData.state,
      postal_code: formData.postal_code,
      country: 'India'
    },
    items: cartItems,
    user_id: user ? user.id : null
  };
  ```

---

## Verified Claims

- **Admin middleware checks user.role** → **Verified** via code review of `backend/server.js` (lines 46–51). If `role !== 'admin'`, it correctly returns `403`.
- **JWT token validation works** → **Verified** via code review of `backend/server.js` (lines 33–44). Correctly checks `Authorization` Bearer token and sets `req.user`.
- **Stock decrement updates database correctly** → **Verified** via code review of `backend/server.js` (lines 726–731). Uses safe SQLite update clamp `SET inventory = CASE WHEN inventory - ? < 0 THEN 0 ELSE inventory - ? END` to prevent negative inventory values.
- **Double payment replay protection works** → **Verified** via code review of `backend/server.js` (lines 387–389). Blocks verification if the order is already marked `paid`.
- **Decimal/negative inventory inputs rejected** → **Verified** via code review of `backend/server.js` (line 501). Rejects inputs that are not non-negative integers.

---

## Coverage Gaps
- **Concurrent Checkout Stock Races** — Risk Level: **Medium** — The stock check is performed at checkout initiation (`/api/orders/create`), but the actual decrement occurs after payment verification (`/api/orders/verify`). If multiple checkouts are created simultaneously for the last stock unit and paid concurrently, the stock decrement query will clamp to `0`, but the system will have accepted payment for more items than available.
- **SQLite Concurrency & Parallel DB execution** — Risk Level: **Low** — In `processReceiptAndInventory`, SQLite queries for multiple items are executed asynchronously in parallel. Under high concurrency, this could trigger `SQLITE_BUSY` lock issues. Placing inventory updates inside a database transaction is recommended.

---

## Unverified Items
- **Actual execution of automated tests** — Reason: Command execution timed out due to OS/Environment approval requirements. However, static code analysis of the test suite (`backend/tests/integration.js` and `backend/test_verification.js`) was performed, verifying that they would run successfully because the tests pass the correct Authorization headers and address objects (masking the frontend UI bugs).

---

# Adversarial Challenge Report

## Challenge Summary
**Overall risk assessment**: HIGH (due to broken core checkout flow in UI)

## Challenges

### [Critical] Challenge 1: Broken Checkout Integration
- **Assumption challenged**: Frontend checkout behaves consistently with the backend requirements.
- **Attack scenario**: Any user tries to check out a product in their cart.
- **Blast radius**: The checkout API returns HTTP 401, blocking order placement.
- **Mitigation**: Add the Authorization header to `CartDrawer.jsx` fetch request.

### [High] Challenge 2: Corrupted Address Fields on Receipts & Dashboard
- **Assumption challenged**: Address details can be parsed as a structured object.
- **Attack scenario**: An administrator views orders on the admin dashboard, or a receipt is written to `logs/receipts/`.
- **Blast radius**: The address renders as empty commas and undefined properties (e.g. `, , , - , `) because the address was stored as a flat string instead of a structured object.
- **Mitigation**: Send the address object directly from the React checkout form.

### [Medium] Challenge 3: Over-allocation Stock Race Condition
- **Assumption challenged**: Checkouts will not exceed inventory capacity.
- **Attack scenario**: Multiple users purchase the same limited-stock item (e.g., stock = 1) at the same time. Both checkouts are initialized and paid.
- **Blast radius**: Over-selling occurs. The database prevents negative stock numbers but accepts payment for both orders.
- **Mitigation**: Reserve stock at checkout creation or check stock availability inside `/api/orders/verify` prior to completing payment.
