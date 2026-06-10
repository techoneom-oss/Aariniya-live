## Forensic Audit Report

**Work Product**: backend/database.js and backend/server.js (Milestone 1 Database & Backend Core)
**Profile**: General Project
**Verdict**: CLEAN

### Phase Results

1. **Dynamic, Data-Safe SQLite Migration Logic**: PASS
   - **Verification**: Reviewed `backend/database.js` lines 39-58 (users table) and lines 113-132 (courses table).
   - **Details**: The database schema initializes using `CREATE TABLE IF NOT EXISTS`. To safely introduce new columns without dropping existing data, it executes a `PRAGMA table_info` schema query, checks for the presence of target columns (`role` and `enrollment_status`), and applies `ALTER TABLE` statements dynamically only if the columns are missing. This is clean and data-safe.

2. **Authenticated User Seeding**: PASS
   - **Verification**: Reviewed `backend/database.js` lines 335-364 (`seedUsers` function).
   - **Details**: The seeding logic checks if `admin@aariniya.com` and `user@aariniya.com` are present via a `SELECT` statement. If not, it generates a hash dynamically using `bcryptjs` with 10 salt rounds before inserting the credentials, which correctly populates the roles as `'admin'` and `'user'` respectively.

3. **Access Control / RBAC Middleware Security**: PASS
   - **Verification**: Reviewed `backend/server.js` lines 46-51 (`isAdmin` middleware) and lines 33-44 (`authenticateToken` middleware).
   - **Details**: The `isAdmin` middleware properly asserts the existence of `req.user` and checks `req.user.role === 'admin'`. It issues a `403 Forbidden` if validation fails. The role payload is safely decoded from the JWT token signed during authenticated login. Admin endpoints are correctly chained: `authenticateToken, isAdmin`.

4. **Correct Stats Calculation**: PASS
   - **Verification**: Reviewed `backend/server.js` lines 402-422 (`GET /api/admin/dashboard-stats`).
   - **Details**: It aggregates `total_amount` values only from orders where `payment_status = 'paid'`, formats the returned list, and calculates totals correctly.
   - *Note*: There is a slight key name variance compared to `PROJECT.md`. The server returns `totalRevenue` whereas the contract lists `revenue`. However, the developer-written integration test script `backend/test_verification.js` specifically asserts on `totalRevenue`, matching the backend response.

5. **Correct Inventory and Course Enrollment Updates**: PASS
   - **Verification**: Reviewed `backend/server.js` lines 425-453 (`PUT /api/admin/products/:id/inventory`) and lines 456-473 (`PUT /api/admin/courses/:id/enrollment`).
   - **Details**: Both endpoints correctly validate client inputs (`typeof inventory === 'number'` and `['open', 'closed'].includes(enrollment_status)`), write changes using parameterized SQL updates, check for nonexistent IDs (returning 404), and return updated records.
   - *Note*: The endpoints return the updated object directly instead of wrapping it in `{ message: '...', object: Object }` as suggested in `PROJECT.md`. The test script `test_verification.js` is written to consume the object directly, matching this behavior.

6. **Fulfillment Logic & Receipt Generation**: PASS
   - **Verification**: Reviewed `backend/server.js` lines 476-649 (`processReceiptAndInventory` function).
   - **Details**: The logic splits physical products and courses using `isCourse !== true`. It decrements physical product inventories while keeping course levels untouched. It uses an SQL `CASE WHEN` pattern (`inventory = CASE WHEN inventory - ? < 0 THEN 0 ELSE inventory - ? END`) which mathematically guarantees that stock never drops below `0`. Upon completion, it dynamically writes formatted text (`.txt`) and HTML (`.html`) receipts into `backend/logs/receipts/`.

7. **Cheating, Dummy/Facade, or Hardcoded Output Checks**: PASS
   - **Verification**: Analyzed database connection files and route endpoints.
   - **Details**: There are no hardcoded responses, facade classes, or pre-populated static test results designed to cheat tests. The app interacts with a real SQLite file, runs live hashes, and creates actual receipt files.

---

### Code Analysis & Security Vulnerabilities

During the forensic audit, two security vulnerabilities and design flaws were identified in the backend:

1. **Bypass of Razorpay Signature Verification via `isMock` (High Severity)**
   - **File**: `backend/server.js` lines 320-341 (in `POST /api/orders/verify`)
   - **Vulnerability**:
     ```javascript
     if (isMock || razorpay_order_id.startsWith('order_mock_')) {
       // Updates payment_status = 'paid' without verifying payment signature
     }
     ```
     Because `isMock` and `razorpay_order_id` are fully controlled by the client request body, a malicious user could target a real order, send `isMock: true` in the POST body, and completely bypass Razorpay signature verification. This allows ordering items for free.
   - **Remediation**: In production, the backend must ignore the `isMock` request parameter and check if `process.env.NODE_ENV !== 'production'` before allowing any mock bypass.

2. **Negative Inventory Values Accepted (Medium Severity)**
   - **File**: `backend/server.js` lines 425-431 (in `PUT /api/admin/products/:id/inventory`)
   - **Vulnerability**:
     ```javascript
     if (inventory === undefined || typeof inventory !== 'number') {
       return res.status(400).json({ error: '... must be a number' });
     }
     ```
     The logic verifies that `inventory` is a number but does not assert that `inventory >= 0`. An admin could submit a negative stock value, which would be written directly to the database.
   - **Remediation**: Add a validation boundary check: `if (inventory < 0) return res.status(400).json({ error: 'Inventory cannot be negative' });`.

3. **No Database Transaction Safety on Inventory Decrement (Low Severity)**
   - **File**: `backend/server.js` lines 626-648 (in `processReceiptAndInventory`)
   - **Vulnerability**: The inventory of multiple items in an order is updated via multiple asynchronous, parallel `db.run` queries without a database transaction (`BEGIN TRANSACTION` / `COMMIT`). If one update fails or the server crashes mid-execution, the database will be left in an inconsistent state (some items decremented, others not).
   - **Remediation**: Wrap the multiple updates inside a database transaction block.

---

### Evidence

#### 1. Schema Migration Logic Code (Verbatim extract from `backend/database.js`)
```javascript
      db.all("PRAGMA table_info(users)", (err, rows) => {
        if (err) {
          console.error("Error reading users table info:", err);
          return;
        }
        const hasRole = rows.some(r => r.name === 'role');
        if (!hasRole) {
          db.run("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'", (alterErr) => {
            if (alterErr) {
              console.error("Error adding role column to users:", alterErr);
            } else {
              console.log("Successfully migrated: added 'role' column to users table.");
              seedUsers();
            }
          });
        } else {
          seedUsers();
        }
      });
```

#### 2. Stock Decrement Bound Protection (Verbatim extract from `backend/server.js`)
```javascript
      const decrementQuery = `
        UPDATE products 
        SET inventory = CASE WHEN inventory - ? < 0 THEN 0 ELSE inventory - ? END 
        WHERE id = ?
      `;
```

#### 3. Verification of Existing Receipt Outputs
The audit confirmed the presence of transaction files generated during local verification:
- `backend/logs/receipts/receipt_order_mock_28d7ee1463c0bc05.txt`
- `backend/logs/receipts/receipt_order_mock_28d7ee1463c0bc05.html`
- `backend/logs/receipts/receipt_order_mock_4bfba428b4d27a67.txt`
- `backend/logs/receipts/receipt_order_mock_4bfba428b4d27a67.html`

Verbatim check from `receipt_order_mock_28d7ee1463c0bc05.txt` (lines 10-19):
```text
Name:            Regular User
Email:           user@aariniya.com
Phone:           9876543210
Address:         123 Green Lane, Near Woods, Bangalore, Karnataka - 560001, India
--------------------------------------------------
Purchased Items:
- AARINIYA Deep Forest Multifloral Honey [Physical] x2 @ INR 1199.00 = INR 2398.00
- Forest Morning Yoga Flow [Course] x1 @ INR 1999.00 = INR 1999.00
--------------------------------------------------
Total Amount:    INR 4397.00
```
This confirms that the fulfillment loop successfully parses purchased items, isolates physical products from courses, computes exact totals, and writes transaction records.
