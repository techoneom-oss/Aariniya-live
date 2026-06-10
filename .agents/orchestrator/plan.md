# Aariniya wellness brand platform expansion plan

## Objective
Implement R1 (Secure Admin Dashboard), R2 (Transaction Email Receipts), and R3 (Automated E2E Testing) for the Aariniya wellness brand platform.

## Execution Plan

### Milestone 1: Database & Backend Core Updates (R1 & R2 Backend)
1. **Database Schema updates (`backend/database.js`)**:
   - Add `role` column to `users` table (TEXT DEFAULT 'user').
   - Add `enrollment_status` column to `courses` table (TEXT DEFAULT 'open').
   - Seed a default admin user and update courses seed.
2. **Auth & Middleware (`backend/server.js`)**:
   - Include `role` in JWT payload on signup and login.
   - Implement `isAdmin` middleware.
3. **Admin Dashboard endpoints (`backend/server.js`)**:
   - `GET /api/admin/dashboard-stats` (calculates revenue, total order count, active orders list).
   - `PUT /api/admin/products/:id/inventory` (updates product stock).
   - `PUT /api/admin/courses/:id/enrollment` (updates course enrollment status).
4. **Order Completion and Receipt Generator (`backend/server.js`)**:
   - Upon successful payment verification:
     - Decrement product inventory for purchased items.
     - Generate a structured HTML/text invoice.
     - Write invoice to `backend/logs/receipts/receipt_<order_id>.html` or `.txt`.
     - Ensure the folder `backend/logs/receipts/` is created dynamically.

### Milestone 2: Frontend Admin Dashboard UI (R1 Frontend)
1. **Create `AdminDashboard.jsx` (`frontend/src/pages/AdminDashboard.jsx`)**:
   - Displays dashboard stats (revenue, order counts, active orders with details).
   - Inventory manager: lists products and courses, allowing updates to stock levels and enrollment status.
   - Implements authentication gates: shows error/redirects if user is not admin.
2. **Navbar updates (`frontend/src/components/Navbar.jsx`)**:
   - Add "Admin Panel" link visible only to logged-in admins.
3. **App Integration (`frontend/src/App.jsx`)**:
   - Add `admin` state/route to the rendering dispatcher.
   - Synchronize login state and parse roles.

### Milestone 3: E2E Integration Testing (R3)
1. **Write integration test (`backend/tests/integration.js`)**:
   - Spawns the backend server on a test port (e.g. 5001).
   - Registers a test user with `role = 'admin'`.
   - Log in and verify JWT authentication and token.
   - Verify access to admin dashboard API.
   - Creates a product checkout order and verifies payment (triggers mock verification).
   - Checks that product inventory decreased in database.
   - Verifies that receipt file is successfully written under `backend/logs/receipts/`.
   - Cleans up database and closes server.
2. **Setup scripts (`package.json`)**:
   - Add `"test:integration": "node tests/integration.js"` script to `backend/package.json` and a redirecting command at project root.

## Verification Gate
- Forensic Auditor verification.
- Run `npm run test:integration` and verify all tests pass.
