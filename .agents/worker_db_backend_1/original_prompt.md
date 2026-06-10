## 2026-06-09T05:44:49Z
Implement database and backend core changes for Aariniya.
Role: worker_db_backend_1.
Milestone 1: Database & Backend Core.
Steps:
1. Initialize progress.md.
2. Modify backend/database.js:
   - Add 'role' column to users table (TEXT DEFAULT 'user').
   - Add 'enrollment_status' column to courses table (TEXT DEFAULT 'open' CHECK(enrollment_status IN ('open', 'closed'))).
   - Write safe backward-compatible SQLite migration queries to run during database initialization (i.e. ALTER TABLE ... ADD COLUMN ... if the columns do not already exist in the user's existing aariniya.db database).
   - Add a seedUsers() function (and invoke it) to seed an admin user ('admin@aariniya.com' with password 'admin123', role 'admin') and a regular user ('user@aariniya.com' with password 'user123', role 'user') using bcryptjs.
3. Modify backend/server.js:
   - Include the 'role' claim in signed JWT token payloads during signup and login, and return 'role' in the user response objects.
   - Update the GET /api/user/profile endpoint to return the 'role' field.
   - Implement an isAdmin middleware: verifies req.user exists and req.user.role === 'admin'. Returns 403 Forbidden if not.
   - Add the admin stats endpoint: GET /api/admin/dashboard-stats. Restrict to admins. Calculate total revenue, order count, and a list of active orders (where payment_status is 'paid'). Parse address and items columns from JSON.
   - Add the product inventory update endpoint: PUT /api/admin/products/:id/inventory. Restrict to admins. Accept { inventory } in body. Update products table, fetch updated product, parse its JSON columns (highlights, taste_profile, ways_to_enjoy, details, who_is_it_for, images), and return it.
   - Add the course status update endpoint: PUT /api/admin/courses/:id/enrollment. Restrict to admins. Accept { enrollment_status } in body. Update courses table, fetch and return updated course.
   - Add a payment verification helper that:
     * Decrements product inventory for physical items in the order (items where isCourse is not true). Ensure inventory does not go below 0 (e.g. MAX(0, inventory - qty)).
     * Formats and writes an HTML receipt and a plain text receipt containing all order details, purchased items, customer details, and total payment.
     * Writes these receipt files to backend/logs/receipts/ using filenames receipt_<razorpay_order_id>.txt and receipt_<razorpay_order_id>.html.
     * Integrates this helper into both mock and real signature verification paths of POST /api/orders/verify, right when payment_status is updated to 'paid'.
4. Verify implementation by running server and tests.
5. Handoff report in handoff.md and message orchestrator.
