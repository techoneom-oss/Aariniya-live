## 2026-06-09T05:58:32Z

You are teamwork_preview_worker.
Your identity is worker_admin_ui_1.
Your working directory is c:/Users/USER/Desktop/Antigravity/2.0/Aariniya/.agents/worker_admin_ui_1.

Your task is to implement the requirements for Milestone 2: Frontend Admin UI and resolve the three backend security and logic issues identified in the Milestone 1 audit.

Please perform the following steps:
1. Initialize progress.md in your working directory and update it regularly with the date and completion checklist.
2. Modify backend/database.js:
   - Immediately after the database connection is established (i.e. db = new sqlite3.Database(dbPath, (err) => { ... })), run:
     db.run("PRAGMA foreign_keys = ON;");
     to ensure SQLite foreign key constraints are strictly enforced.
3. Modify backend/server.js:
   - [Payment Verification Replay / Double-Processing Vulnerability]:
     In POST /api/orders/verify (both inside the mock verification branch and the real signature verification branch), immediately after querying the database for the order:
     * Check if the order's existing 'payment_status' in the database is already 'paid'.
     * If order.payment_status === 'paid', return 400 Bad Request with { error: 'Order has already been processed and paid' } to prevent double processing and double inventory decrement.
   - [HTML Injection in Receipt Logs]:
     * Implement a simple escapeHtml helper function:
       function escapeHtml(str) {
         if (typeof str !== 'string') return str;
         return str
           .replace(/&/g, '&amp;')
           .replace(/</g, '&lt;')
           .replace(/>/g, '&gt;')
           .replace(/"/g, '&quot;')
           .replace(/'/g, '&#039;');
       }
     * Use this helper to escape orderId, razorpay_payment_id, customer_name, email, phone, addressStr, and item.name before embedding them in the HTML receipt (htmlContent and itemsListHtml).
4. Create frontend/src/pages/AdminDashboard.jsx:
   - Ensure it is styled consistently with the Aariniya brand: uses forest green (var(--color-primary)), warm accent (var(--color-accent)), beige background (var(--bg-primary)/var(--bg-secondary)), and rounded corners (var(--radius-lg)).
   - Restrict access: On mount, check if the logged-in user exists and user.role === 'admin'. If not, display an elegant "Access Denied" message or redirect them using setActivePage('home').
   - Fetch and display dashboard stats from GET http://localhost:5000/api/admin/dashboard-stats:
     * Show Total Revenue, Total Orders count, and list of active orders with details (Order ID, Customer Name, Email, Phone, Address, Items Purchased, Total Amount, and Date).
   - Fetch products (GET http://localhost:5000/api/products) and courses (GET http://localhost:5000/api/courses) to display an Inventory Manager:
     * Product inventory section: lists products and allows editing of their 'inventory' stock value. When edited, sends a PUT request to http://localhost:5000/api/admin/products/:id/inventory with { inventory: number }.
     * Course status section: lists courses and allows toggling their 'enrollment_status' between 'open' and 'closed'. When edited, sends a PUT request to http://localhost:5000/api/admin/courses/:id/enrollment with { enrollment_status: string }.
     * Show feedback (success/error banners) when saving changes.
5. Modify frontend/src/components/Navbar.jsx:
   - Render an "Admin Panel" link in the navigation menu next to the "Wellness Courses" link, visible only if the logged-in user exists and user.role === 'admin'.
   - Trigger handleNav('admin') when clicked.
6. Modify frontend/src/App.jsx:
   - Import AdminDashboard from './pages/AdminDashboard'.
   - Add 'admin' case to the switch statement in renderPage(): return <AdminDashboard user={user} setActivePage={setActivePage} />.
7. Update PROJECT.md:
   - Change the Status of Milestone 1 to 'DONE'.
   - Change the Status of Milestone 2 to 'IN_PROGRESS'.
8. Verify all changes:
   - Start the backend server (e.g. run 'node backend/server.js' or start it) and frontend (e.g. run 'npm run dev' or check it).
   - Run the backend verification test file 'node backend/test_verification.js' to make sure all security controls, auth controls, price mismatch, and double-payment checks are verified and passing successfully.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Once finished, write a handoff.md report inside your working directory summarizing:
- What was changed (files and lines).
- Verification results (test commands run and outcomes).
- Handoff path.
Then, send a message back to the orchestrator (conversation ID: 9ac2f685-ff6b-4b09-aefb-18255ef765da) notifying completion.
