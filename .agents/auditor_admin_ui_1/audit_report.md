# Forensic Audit Report

**Work Product**: Milestone 2 Frontend Admin UI changes and Backend security fixes
**Profile**: General Project
**Verdict**: CLEAN

---

### Phase Results

1. **SQLite Foreign Key Enforcement (`PRAGMA foreign_keys = ON;`)**: **PASS**
   - **Verification**: SQLite foreign key constraints are defined on both the `reviews` and `orders` tables.
   - **Code Analysis**: In `backend/database.js`, the database connection is instantiated and `db.run("PRAGMA foreign_keys = ON;");` is executed immediately upon connection.
   - **Empirical Check**: A system-wide search of Javascript files verified that `sqlite3` is only imported and instantiated in `backend/database.js`. Thus, all database operations leverage this connection with active foreign key enforcement.

2. **Payment Verification Replay Check**: **PASS**
   - **Verification**: The `/api/orders/verify` route in `backend/server.js` checks if the order status is already `'paid'`. If so, it immediately rejects the request with a `400 Bad Request`.
   - **Empirical Check**: Running `node backend/test_verification.js` validates this protection under active execution, confirming that verification replay attempts return status `400` with the correct error payload: `{"error":"Order has already been processed and paid"}`.

3. **Stored XSS Protection in HTML Receipts**: **PASS**
   - **Verification**: In `backend/server.js`, a genuine `escapeHtml` helper is declared to replace HTML meta-characters (`&`, `<`, `>`, `"`, `'`) with their respective HTML entities.
   - **Code Analysis**: During HTML invoice receipt generation in `processReceiptAndInventory` (lines 592-706), all dynamic fields, including `customer_name`, `email`, `phone`, `address`, and `item.name`, are processed through `escapeHtml(...)` before being interpolated into the HTML document template.

4. **Admin Panel Access Control**: **PASS**
   - **Verification**: In `backend/server.js`, the `isAdmin` middleware intercepts administrative endpoints and asserts `req.user.role === 'admin'`. Unauthorized requests receive `403 Forbidden`. In `frontend/src/pages/AdminDashboard.jsx`, the UI access check asserts `user && user.role === 'admin'`. Unauthorized UI access renders a clear "Access Denied" view and blocks access.
   - **Empirical Check**: Verified via execution of `test_verification.js`, returning `403` status codes for unauthorized `/api/admin/dashboard-stats` calls.

5. **Dynamic Updates (Inventory and Course Enrollment)**: **PASS**
   - **Verification**: Product inventory level edits and course enrollment status toggles can be managed directly from the Admin Dashboard, which targets `/api/admin/products/:id/inventory` and `/api/admin/courses/:id/enrollment` respectively.
   - **Empirical Check**: Authorized updates return successful updates, which are persisted to `aariniya.db` and correctly reflected in the database. Negative or decimal inventory edits are rejected with `400 Bad Request`.

6. **Automated Verification Test Suite Execution**: **PASS**
   - **Verification**: Executed `node backend/test_verification.js`. All 7 core assertions and new security checks passed successfully.

7. **Bypasses, Facades, or Cheating Checks**: **PASS**
   - **Verification**: The backend endpoints and frontend dashboard views are authentically implemented. No facade functions returning constants, pre-calculated outputs, or test bypasses were discovered.

---

### Key Observations & Functional Findings

#### **Finding 1: Course ID Prefix Mismatch (Integration Bug)**
- **Observation**: 
  In `frontend/src/pages/Courses.jsx` (lines 106-112), enrolling in a course passes the ID as `course_${c.id}` (e.g. `"course_1"`):
  ```javascript
  onEnrollCourse({
    id: `course_${c.id}`,
    name: c.title,
    price: c.price,
    image: c.image,
    isCourse: true
  })
  ```
  However, in `backend/server.js` (lines 284-286), the backend queries the database directly using `item.id`:
  ```javascript
  if (item.isCourse) {
    const course = await getCourseById(item.id);
  ```
  `getCourseById` queries the SQLite table where `id` is an integer, matching against `"course_1"`, which returns `undefined`. Thus, submitting a checkout with a course in the cart from the UI returns `400 Bad Request` ("Invalid order amount").
- **Impact**: This prevents users from completing checkouts containing courses from the frontend UI.
- **Remediation**: The backend should parse `item.id` to extract the integer portion (e.g., stripping the `"course_"` prefix if present), or the frontend should pass raw integer IDs.
- **Integrity Assessment**: This is an integration bug rather than an integrity violation, as there is no facade implementation or cheating.

---

### Empirical Evidence

#### **Test Verification Execution Log**
```
=== STARTING BACKEND VERIFICATION TESTS ===
Waiting for database connection and initialization...
Connected to SQLite database at: C:\Users\USER\Desktop\Antigravity\2.0\Aariniya\backend\aariniya.db
- Users table has 'role' column: true
- Courses table has 'enrollment_status' column: true
- Admin seed verification: role is admin
- User seed verification: role is user
Logging in as admin...
- Admin login response keys: message,token,user
- Admin login user role: admin
Logging in as regular user...
- User login response keys: message,token,user
- User login user role: user
Fetching admin profile...
- Profile role field: admin
Fetching admin dashboard stats (Authorized)...
- Dashboard stats status: 200
- Dashboard stats revenue: 13191, count: 3
Fetching admin dashboard stats (Unauthorized)...
- Dashboard stats unauth response status: 403
Updating product inventory (Authorized)...
- Updated product inventory response status: 200
- Updated inventory value in response: 85
Updating product inventory (Unauthorized)...
- Updated inventory unauth status: 403
Updating course status (Authorized)...
- Updated course status response status: 200
- Updated enrollment_status in response: closed
Updating course status with invalid body...
- Course status invalid body response status: 400
Creating checkout order...
- Created order response ID: order_mock_95f50753a22fb777, amount: 439700
- Product 1 inventory before payment: 85
Verifying payment...
- Payment verify status: success
- Product 1 inventory after payment: 83
- Receipt TXT exists: true
- Receipt HTML exists: true
- TXT receipt contains order ID: true
- TXT receipt contains payment ID: true
- HTML receipt contains order ID: true
Checking dashboard stats again to verify totals...
- Updated revenue: 17588
- Updated order count: 4
=== STARTING NEW SECURITY & INTEGRITY CHECKS ===
Testing Price Manipulation Protection (amount mismatch)...
- Price Manipulation response status: 400
- Price Manipulation response: {"error":"Invalid order amount"}
Testing Negative/Decimal Quantity Protection...
- Negative Quantity response status: 400
Testing Insufficient Stock Protection...
- Insufficient stock response status: 400
- Insufficient stock response: {"error":"Insufficient stock for product AARINIYA Deep Forest Multifloral Honey"}
Testing Unauthorized Checkout Protection...
- Unauthorized Checkout response status: 401
Testing Nonexistent Order Verification Protection...
- Nonexistent Order Verification response status: 404
- Nonexistent Order Verification response: {"error":"Order not found"}
Testing Negative Inventory Update Protection...
- Negative Inventory response status: 400
Testing Decimal Inventory Update Protection...
- Decimal Inventory response status: 400
Testing Double Payment / Verification Replay Protection...
- Double Payment Verification response status: 400
- Double Payment Verification response: {"error":"Order has already been processed and paid"}
=== ALL TESTS PASSED SUCCESSFULLY! ===
```
