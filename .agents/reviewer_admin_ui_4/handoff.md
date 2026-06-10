# Handoff Report: Milestone 2 Review

## 1. Observation
I directly observed the following from the codebase:
- **Missing Token Header**: In `frontend/src/components/CartDrawer.jsx` (Lines 71–75):
  ```javascript
  const res = await fetch('http://localhost:5000/api/orders/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(checkoutData)
  });
  ```
  No `Authorization` header is present.
- **Protected Endpoint**: In `backend/server.js` (Line 266):
  ```javascript
  app.post('/api/orders/create', authenticateToken, async (req, res) => {
  ```
  The endpoint requires the `authenticateToken` middleware, which expects a Bearer token in the `Authorization` header.
- **Address String Serialization**: In `frontend/src/components/CartDrawer.jsx` (Lines 56, 64):
  ```javascript
  const addressString = `${formData.address_line1}, ${formData.address_line2 ? formData.address_line2 + ', ' : ''}${formData.city}, ${formData.state} - ${formData.postal_code}`;
  ...
  address: addressString,
  ```
- **Address JSON Parsing**: In `backend/server.js` (Line 571):
  ```javascript
  address = typeof order.address === 'string' ? JSON.parse(order.address) : (order.address || {});
  ```
  And in `frontend/src/pages/AdminDashboard.jsx` (Line 238):
  ```javascript
  const addressStr = `${o.address.address_line1 || ''}, ${o.address.address_line2 || ''}, ${o.address.city || ''}, ${o.address.state || ''} - ${o.address.postal_code || ''}, ${o.address.country || ''}`;
  ```
  And in `frontend/src/pages/Profile.jsx` (Line 275):
  ```javascript
  address: JSON.parse(o.address || '{}')
  ```

## 2. Logic Chain
1. Since the backend `POST /api/orders/create` route requires a valid JWT Bearer token, any request that lacks the `Authorization: Bearer <token>` header will be rejected with `401 Access token required`.
2. Since `CartDrawer.jsx` handles submitting checkouts to `POST /api/orders/create` but does not include any `Authorization` header (Observation 1), all browser checkouts will fail with a `401 Unauthorized` response.
3. Since `CartDrawer.jsx` serializes the address form fields into a flat string `addressString` and sends it as `address: addressString` (Observation 3), the backend saves a double-serialized JSON string.
4. When `processReceiptAndInventory` or the Admin Dashboard attempts to read or display properties of `o.address` (like `address_line1`, `city`, etc.) (Observation 4), it does so on a parsed string object (which evaluates properties as `undefined`), leading to blank address strings like `, , , - , ` in the receipts and dashboard.

## 3. Caveats
- Direct command-line automated execution was not performed because terminal command permissions timed out. However, static verification and review of `backend/tests/integration.js` and `backend/test_verification.js` was conducted. The test script does pass `Authorization` and the `address` object, which explains why the test suite passed while the user UI remains broken.
- High-concurrency performance and SQLite write-locking limits under heavy load were not stress-tested.

## 4. Conclusion
The Milestone 2 implementation **requires changes** before merging. The frontend Admin UI is feature-complete and matches the interface contracts, but the core user checkout flow is broken due to two distinct integration gaps: (1) missing Authorization Bearer token header in `CartDrawer.jsx` and (2) sending the address field as a serialized string instead of a structured JSON object.

## 5. Verification Method
To verify these issues:
1. Open the Aariniya website in a browser, log in, add items to the cart, fill out the shipping address, and click "Place Order & Pay".
2. Open the browser's developer console network tab and verify that the request to `/api/orders/create` returns `401 Access token required`.
3. Fix the headers in `CartDrawer.jsx`, run checkout, and verify the generated receipt in `backend/logs/receipts/` or on the Admin Dashboard page. Check if the address renders correctly or if it corrupts to empty commas `, , ,  - , `.
