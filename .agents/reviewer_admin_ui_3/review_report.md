# Aariniya Milestone 2 Review Report

This report evaluates the Milestone 2 implementation: Frontend Admin UI and Backend security fixes.

---

# part 1: Quality Review Report

## Review Summary

**Verdict**: REQUEST_CHANGES

The overall implementation of the Admin Dashboard UI and backend security controls is highly structured, visually clean, and robustly protected against common vulnerabilities (such as SQL injection, parameter tampering, and price manipulation). However, a major correctness bug exists due to a data contract mismatch between the frontend checkout form and the backend/admin view parsing logic for shipping addresses, resulting in empty/malformed address displays (`", , ,  - , "`) on receipts and the Admin Dashboard registry.

---

## Findings

### [Major] Finding 1: Address Object/String Mismatch in Checkout Flow

- **What**: The frontend checkout form serializes the shipping address as a flat string, while the backend and admin panel expect it to be a structured object.
- **Where**:
  - `frontend/src/components/CartDrawer.jsx`: Lines 56–66 (constructs `addressString` and sends it as `address: addressString` string).
  - `backend/server.js`: Line 612 (expects `address` to be an object with properties like `address_line1`, `city`, etc., when formatting `addressStr` for receipts).
  - `frontend/src/pages/AdminDashboard.jsx`: Line 238 (attempts to parse and access properties on `o.address` assuming it is an object).
- **Why this is a problem**: When a real user completes a checkout via the web application, their shipping address is stored in the database as a simple serialized JSON string (e.g. `'"Flat 101, Green Apartments, Bangalore, Karnataka - 560001"'`). When retrieved and parsed, it remains a string, causing all dot-notation accesses (like `address.address_line1`) to return `undefined`. Consequently, both the written receipts (TXT and HTML) and the Admin Dashboard Registry display empty, malformed addresses (formatted as `", , ,  - , "`).
- **Suggestion**: Update `frontend/src/components/CartDrawer.jsx` to pass `address` as a structured object:
  ```javascript
  address: {
    address_line1: formData.address_line1,
    address_line2: formData.address_line2 || '',
    city: formData.city,
    state: formData.state,
    postal_code: formData.postal_code,
    country: 'India'
  }
  ```
  Alternatively, update the backend `server.js` and frontend `AdminDashboard.jsx` to check the type of `address` and handle flat strings gracefully:
  ```javascript
  const addressStr = typeof address === 'string' ? address : `${address.address_line1 || ''}, ...`;
  ```

### [Minor] Finding 2: Hardcoded Fallback JWT Secret in Production Configuration

- **What**: A default hardcoded JWT secret is used if no environment variable is provided.
- **Where**: `backend/server.js`: Line 20
- **Why this is a problem**: Hardcoded secrets can be checked into version control, posing a major security risk if environment variables are missing or misconfigured in production.
- **Suggestion**: Remove the default fallback secret in production mode or throw an explicit error on start if `process.env.JWT_SECRET` is undefined:
  ```javascript
  if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
    throw new Error("FATAL: JWT_SECRET environment variable is required in production mode");
  }
  ```

---

## Verified Claims

- **Role-based API protection (isAdmin)** → verified via code inspection of `backend/server.js` (lines 46–51) and verification test checks → **PASS**
  - Token parsing correctly checks `req.user.role === 'admin'`. If not, returns `403 Forbidden`.
  - Admin endpoints (`/api/admin/dashboard-stats`, `/api/admin/products/:id/inventory`, `/api/admin/courses/:id/enrollment`) properly apply the `isAdmin` middleware.
- **Price Manipulation Protection** → verified via code inspection of `backend/server.js` (lines 276–308) and verification test checks → **PASS**
  - Total order amount is re-computed on the backend by querying the database for prices of each submitted item ID and multiplying by quantity. If the request amount does not match the re-calculated total, the order creation is rejected with `400 Bad Request`.
- **Payment Verification Integrity** → verified via code inspection of `backend/server.js` (lines 373–456) and verification test checks → **PASS**
  - Uses Razorpay signature verification with SHA256 HMAC for non-mock orders.
  - Prevents replay attacks / double payments by checking if the order status is already `'paid'` before initiating verification (returning `400` if so).
- **Product Stock Decrementing** → verified via code inspection of `backend/server.js` (lines 722–744) and verification test checks → **PASS**
  - Inventory decrements automatically upon successful payment verification.
  - Database constraint ensures inventory levels do not drop below `0`.
- **Receipt Writing** → verified via code inspection of `backend/server.js` (lines 580–715) and verification test checks → **PASS**
  - Successfully writes both TXT and HTML files containing sanitized metadata, client info, order items, and amount details into `backend/logs/receipts/`.

---

## Coverage Gaps

- **E2E Browser Interaction Testing** — risk level: **LOW** — recommendation: **accept risk**
  - The E2E tests (`backend/tests/integration.js`) simulate HTTP requests and database state transitions but do not run a real headless browser. However, since the frontend uses straightforward fetch requests and localStorage state management, this risk is acceptable.

---

## Unverified Items

- **Real Payment Gateway Connectivity** — reason not verified:
  - Real Razorpay credentials were not provided, and testing was conducted using the verified mock payment sandbox branch, which is acceptable for developer environment testing.

---
---

# part 2: Adversarial Challenge Report

## Challenge Summary

**Overall risk assessment**: MEDIUM

While the backend exhibits strong defences against client-side parameter manipulation (such as price injection and negative item quantities), several systemic assumptions could lead to operational failure under specific stress scenarios.

---

## Challenges

### [Medium] Challenge 1: Stock Overselling Race Condition

- **Assumption challenged**: The current implementation assumes that stock checked during order creation (`/api/orders/create`) will still be available when payment is verified (`/api/orders/verify`).
- **Attack scenario**: Under high traffic (e.g. flash sales):
  1. Product X has `inventory = 1`.
  2. User A initiates checkout. Backend checks inventory, finds `1 >= 1`, and creates a pending order.
  3. User B initiates checkout. Backend checks inventory, finds `1 >= 1`, and creates a pending order.
  4. Both users are redirected to Razorpay and complete their payments.
  5. User A's payment is verified first. Inventory decrements to `0`. Receipt A is written.
  6. User B's payment is verified next. Inventory decrements to `0` (database query sets it to `0` via `CASE WHEN inventory - ? < 0 THEN 0`). Receipt B is written.
  7. **Result**: Both users paid for the item, but only one item was in stock. The brand has oversold the product.
- **Blast radius**: Customer dissatisfaction, payment refund overhead, inventory ledger mismatch.
- **Mitigation**: Reserve stock temporarily upon order creation by decrementing inventory immediately and holding it for a short time (e.g., 10 minutes). If payment fails or expires, restore the stock.

### [Low] Challenge 2: HTML Injection via Sanitized Fields in HTML Receipts

- **Assumption challenged**: The receipt generator assumes HTML input escaping prevents injection attacks.
- **Attack scenario**: A user registers with the name `<script>alert(1)</script>` or inputs malicious code into form inputs.
- **Blast radius**: Stored XSS if receipts are rendered in administrative interfaces without proper sanitization.
- **Mitigation**: The current system implements `escapeHtml` (lines 546-554 in `server.js`) on fields written to the HTML receipt. This has been validated as effective against script injection. However, nested JSON payloads (like items) could potentially bypass this if item names themselves are modified by an admin and not escaped properly.

---

## Stress Test Results

- **Decimal Inventory Update Protection** → Expected behavior: `400 Bad Request` → Actual: `400 Bad Request` → **PASS**
- **Negative Inventory Update Protection** → Expected behavior: `400 Bad Request` → Actual: `400 Bad Request` → **PASS**
- **Double Payment Verification Replay** → Expected behavior: Rejected with `400 Bad Request` → Actual: Rejected with `400` → **PASS**
- **Price Manipulation Request** → Expected behavior: Rejected with `400 Bad Request` → Actual: Rejected with `400` → **PASS**
