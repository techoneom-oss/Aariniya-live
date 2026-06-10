# Handoff Report: Database & Backend Core Analysis (Milestone 1)

This handoff report summarizes the read-only investigation and proposal for implementing Milestone 1.

---

## 1. Observation

- **`backend/database.js` user schema (lines 20-36)**:
  ```javascript
  db.run(\`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      phone TEXT,
      ...
    )
  \`);
  ```
  *Observations*: No `role` field is configured.

- **`backend/database.js` course schema (lines 78-91)**:
  ```javascript
  db.run(\`
    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      subtitle TEXT,
      description TEXT,
      price REAL NOT NULL,
      type TEXT CHECK(type IN ('yoga', 'diet')),
      duration TEXT,
      image TEXT
    )
  \`);
  ```
  *Observations*: No `enrollment_status` field is configured.

- **`backend/server.js` Auth & JWT (lines 67, 91)**:
  ```javascript
  const token = jwt.sign({ id: this.lastID, email }, JWT_SECRET, { expiresIn: '24h' });
  // and
  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
  ```
  *Observations*: The token signing payload does not contain a `role` field.

- **`backend/server.js` Order Verification (lines 298-362)**:
  ```javascript
  app.post('/api/orders/verify', (req, res) => { ... })
  ```
  *Observations*: The route processes the order signature but does not update product inventory or write receipts.

- **`PROJECT.md` Layout and Contracts (lines 33-53)**:
  - Details requirements for the `isAdmin(req, res, next)` middleware.
  - Specifies interface contracts for endpoints: `GET /api/admin/dashboard-stats`, `PUT /api/admin/products/:id/inventory`, and `PUT /api/admin/courses/:id/enrollment`.

---

## 2. Logic Chain

1. **Database Expansion**: Adding the `role` and `enrollment_status` fields requires table updates. To prevent deleting existing user data in `aariniya.db`, we must run schema migrations (`PRAGMA table_info` followed by `ALTER TABLE`) rather than just relying on `CREATE TABLE IF NOT EXISTS`.
2. **Access Control (RBAC)**: Admin routes must restrict unauthorized access. Since `PROJECT.md` specifies `isAdmin` verifies the role from the token payload (`req.user.role`), we must sign the user's role in the JWT token at login and signup.
3. **Receipts & Stocks**: When an order is paid, standard transactional flow dictates that we update the system:
   - Items in the order must be parsed. Items with `isCourse !== true` must decrement `products.inventory` by the quantity purchased (utilizing `MAX(0, inventory - quantity)` to prevent negative inventory).
   - A text format receipt and an HTML format receipt must be written to `backend/logs/receipts/` using `fs.writeFile`.

---

## 3. Caveats

- **Network Constraints**: The investigation was carried out in `CODE_ONLY` network mode; external API libraries and dependencies were not modified.
- **Cart Format**: We assumed cart item formats from `CartDrawer.jsx` (items include `id`, `name`, `price`, `quantity`, and `isCourse`).

---

## 4. Conclusion

The implementation strategy has been fully drafted and detailed inside `c:/Users/USER/Desktop/Antigravity/2.0/Aariniya/.agents/teamwork_preview_explorer_db_backend_2/analysis.md`. The strategy covers the precise SQL/JS edits, migrations, Express routes, and callback hooks to enable Milestone 1.

---

## 5. Verification Method

To verify the changes after implementation:
1. Check the SQLite schema of `users` and `courses` tables using a SQLite client (`.schema users` and `.schema courses`).
2. Log in using `admin@aariniya.com` / `admin123` and verify that the token response includes `role: 'admin'`.
3. Try making a GET request to `/api/admin/dashboard-stats` without a token (expects `401`), with a user token (expects `403`), and with an admin token (expects `200`).
4. Trigger payment verification (either via Sandbox or Mock) and verify that the product stock is decremented and receipt files are successfully generated at `backend/logs/receipts/receipt_<order_id>.txt` and `backend/logs/receipts/receipt_<order_id>.html`.
