# Milestone 1: Database & Backend Core - Implementation Strategy and Analysis

This report outlines the technical analysis and proposed code modifications to implement **Milestone 1: Database & Backend Core** for the Aariniya wellness platform. 

---

## 1. Database Schema & Seeding Analysis (`backend/database.js`)

### Existing Schema & Observations
- In `backend/database.js`, the SQLite database tables are created inside the `initializeDatabase()` function within a `db.serialize()` block.
- The `users` table currently contains basic user info, address fields, and a timestamp, but lacks a `role` field.
- The `courses` table contains details like `title`, `subtitle`, `description`, `price`, `type`, `duration`, and `image`, but lacks an `enrollment_status` field.
- Seeding functions exist for products (`seedProducts`), reviews (`seedReviews`), and courses (`seedCourses`), but there is no seeding function for users.

### Proposed Database Changes

#### A. Users Table Update
Add a `role` column of type `TEXT` with a default value of `'user'`.
```sql
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT,
  role TEXT DEFAULT 'user', -- New Column
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

#### B. Courses Table Update
Add an `enrollment_status` column of type `TEXT` with a default value of `'open'` and a check constraint to restrict values to `'open'` or `'closed'`.
```sql
CREATE TABLE IF NOT EXISTS courses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  price REAL NOT NULL,
  type TEXT CHECK(type IN ('yoga', 'diet')),
  duration TEXT,
  image TEXT,
  enrollment_status TEXT DEFAULT 'open' CHECK(enrollment_status IN ('open', 'closed')) -- New Column
)
```

#### C. SQLite Schema Migration Caveat & Solution
**Observation:** SQLite's `CREATE TABLE IF NOT EXISTS` statement does not alter the schema of an existing table if it already exists in the database file (`aariniya.db`). 
**Solution:** To ensure developer environments and automated test environments correctly migrate the database file without requiring manual intervention, we propose running alter queries in case the columns are missing. Alternatively, developers can safely delete `aariniya.db` to let the system re-create it. We propose incorporating the following check queries during database initialization to safely add the columns if the DB exists:
```javascript
// Safely migrate existing users table if 'role' column is missing
db.run("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'", (err) => {
  // Ignore errors caused by column already existing
});

// Safely migrate existing courses table if 'enrollment_status' is missing
db.run("ALTER TABLE courses ADD COLUMN enrollment_status TEXT DEFAULT 'open'", (err) => {
  // Ignore errors caused by column already existing
});
```

#### D. User Seeding Implementation
To support admin authentication and testing, we will implement `seedUsers()` inside `backend/database.js`. We will import `bcryptjs` at the top of the file to securely generate passwords.

**Code Proposal for User Seeding:**
```javascript
// Add import at top of backend/database.js
import bcrypt from 'bcryptjs';

// Add seedUsers function
function seedUsers() {
  db.get("SELECT COUNT(*) as count FROM users", (err, row) => {
    if (err) return console.error(err);
    if (row.count === 0) {
      const adminHash = bcrypt.hashSync('admin123', 10);
      const userHash = bcrypt.hashSync('user123', 10);

      const stmt = db.prepare(`
        INSERT INTO users (email, password_hash, full_name, phone, role) 
        VALUES (?, ?, ?, ?, ?)
      `);
      
      // Seed default admin
      stmt.run('admin@aariniya.com', adminHash, 'Aariniya Admin', '9999999999', 'admin');
      // Seed default regular user
      stmt.run('user@aariniya.com', userHash, 'Aariniya Regular User', '8888888888', 'user');
      
      stmt.finalize((err) => {
        if (err) console.error("Error seeding users:", err);
        else console.log("Seeded initial admin and regular users.");
      });
    }
  });
}
```
In `initializeDatabase()`, invoke `seedUsers()` similarly to other seeding:
```javascript
// Inside initializeDatabase:
db.run(`CREATE TABLE IF NOT EXISTS users ...`, () => {
  seedUsers();
});
```

---

## 2. API Endpoints & Auth Middleware (`backend/server.js`)

### A. JWT and Profile Routing Changes
To satisfy the admin constraints, we must include the user's role in the JWT token payload.

1. **Signup Route (`/api/auth/signup`)**:
   Support receiving `role` in the request body (useful for automated testing) and save it. Generate JWT token with `role` inside it.
   ```javascript
   // Modify signup handler
   app.post('/api/auth/signup', (req, res) => {
     const { email, password, full_name, phone, role } = req.body;
     if (!email || !password || !full_name) {
       return res.status(400).json({ error: 'Email, password and name are required' });
     }
     
     const userRole = role || 'user';
     const salt = bcrypt.genSaltSync(10);
     const passwordHash = bcrypt.hashSync(password, salt);

     const query = `
       INSERT INTO users (email, password_hash, full_name, phone, role) 
       VALUES (?, ?, ?, ?, ?)
     `;

     db.run(query, [email, passwordHash, full_name, phone || '', userRole], function(err) {
       if (err) {
         if (err.message.includes('UNIQUE constraint failed')) {
           return res.status(400).json({ error: 'Email is already registered' });
         }
         return res.status(500).json({ error: err.message });
       }
       
       // Sign JWT with role
       const token = jwt.sign({ id: this.lastID, email, role: userRole }, JWT_SECRET, { expiresIn: '24h' });
       
       res.status(201).json({
         message: 'Signup successful',
         token,
         user: { id: this.lastID, email, full_name, phone: phone || '', role: userRole }
       });
     });
   });
   ```

2. **Login Route (`/api/auth/login`)**:
   Query the `role` database column and sign the JWT payload with `role`.
   ```javascript
   // Modify login handler
   app.post('/api/auth/login', (req, res) => {
     const { email, password } = req.body;
     if (!email || !password) {
       return res.status(400).json({ error: 'Email and password are required' });
     }

     db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
       if (err) return res.status(500).json({ error: err.message });
       if (!user) return res.status(401).json({ error: 'Invalid email or password' });

       const validPassword = bcrypt.compareSync(password, user.password_hash);
       if (!validPassword) return res.status(401).json({ error: 'Invalid email or password' });

       // Sign JWT with role
       const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });

       res.json({
         message: 'Login successful',
         token,
         user: {
           id: user.id,
           email: user.email,
           full_name: user.full_name,
           phone: user.phone,
           role: user.role, // Returned to client
           address_line1: user.address_line1,
           address_line2: user.address_line2,
           city: user.city,
           state: user.state,
           postal_code: user.postal_code,
           country: user.country
         }
       });
     });
   });
   ```

3. **Get Profile Route (`/api/user/profile`)**:
   Update query to include `role` field.
   ```javascript
   app.get('/api/user/profile', authenticateToken, (req, res) => {
     db.get(
       'SELECT id, email, full_name, phone, role, address_line1, address_line2, city, state, postal_code, country FROM users WHERE id = ?',
       [req.user.id],
       (err, user) => {
         if (err) return res.status(500).json({ error: err.message });
         if (!user) return res.status(404).json({ error: 'User not found' });
         res.json(user);
       }
     );
   });
   ```

### B. Admin Middleware Implementation
Define an `isAdmin` middleware to restrict routes to admin accounts. The token payload parsed by `authenticateToken` is stored in `req.user`.

```javascript
// --- ADMIN CHECK MIDDLEWARE ---
const isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied: Admin role required' });
  }
  next();
};
```

### C. Admin API Endpoints
Implement endpoints matching the interface contracts specified in `PROJECT.md`.

1. **Admin Dashboard Stats Endpoint (`GET /api/admin/dashboard-stats`)**:
   Fetches total revenue, order count, and a list of active orders (where status is `'paid'`).
   ```javascript
   app.get('/api/admin/dashboard-stats', authenticateToken, isAdmin, async (req, res) => {
     try {
       // Query total sales and counts for successful orders
       const stats = await new Promise((resolve, reject) => {
         db.get(
           "SELECT SUM(total_amount) as revenue, COUNT(*) as count FROM orders WHERE payment_status = 'paid'",
           (err, row) => {
             if (err) reject(err);
             else resolve(row);
           }
         );
       });

       // Query all active (paid) orders
       const activeOrders = await new Promise((resolve, reject) => {
         db.all(
           "SELECT * FROM orders WHERE payment_status = 'paid' ORDER BY created_at DESC",
           (err, rows) => {
             if (err) reject(err);
             else {
               const formatted = rows.map(order => ({
                 ...order,
                 address: JSON.parse(order.address || '{}'),
                 items: JSON.parse(order.items || '[]')
               }));
               resolve(formatted);
             }
           }
         );
       });

       res.json({
         revenue: stats.revenue || 0,
         orderCount: stats.count || 0,
         activeOrders: activeOrders
       });
     } catch (err) {
       res.status(500).json({ error: err.message });
     }
   });
   ```

2. **Update Product Inventory (`PUT /api/admin/products/:id/inventory`)**:
   Modifies product stock and returns the updated product.
   ```javascript
   app.put('/api/admin/products/:id/inventory', authenticateToken, isAdmin, (req, res) => {
     const { inventory } = req.body;
     if (inventory === undefined || typeof inventory !== 'number' || inventory < 0) {
       return res.status(400).json({ error: 'Valid inventory quantity is required' });
     }

     db.run(
       'UPDATE products SET inventory = ? WHERE id = ?',
       [inventory, req.params.id],
       function(err) {
         if (err) return res.status(500).json({ error: err.message });
         if (this.changes === 0) return res.status(404).json({ error: 'Product not found' });

         db.get('SELECT * FROM products WHERE id = ?', [req.params.id], (getErr, product) => {
           if (getErr) return res.status(500).json({ error: getErr.message });
           
           res.json({
             message: 'Inventory updated successfully',
             product: {
               ...product,
               highlights: JSON.parse(product.highlights || '[]'),
               taste_profile: JSON.parse(product.taste_profile || '{}'),
               ways_to_enjoy: JSON.parse(product.ways_to_enjoy || '[]'),
               details: JSON.parse(product.details || '{}'),
               who_is_it_for: JSON.parse(product.who_is_it_for || '[]'),
               images: JSON.parse(product.images || '[]')
             }
           });
         });
       }
     );
   });
   ```

3. **Update Course Status (`PUT /api/admin/courses/:id/enrollment`)**:
   Modifies course enrollment status and returns the updated course object.
   ```javascript
   app.put('/api/admin/courses/:id/enrollment', authenticateToken, isAdmin, (req, res) => {
     const { enrollment_status } = req.body;
     if (!enrollment_status || !['open', 'closed'].includes(enrollment_status)) {
       return res.status(400).json({ error: 'Invalid enrollment status. Must be open or closed' });
     }

     db.run(
       'UPDATE courses SET enrollment_status = ? WHERE id = ?',
       [enrollment_status, req.params.id],
       function(err) {
         if (err) return res.status(500).json({ error: err.message });
         if (this.changes === 0) return res.status(404).json({ error: 'Course not found' });

         db.get('SELECT * FROM courses WHERE id = ?', [req.params.id], (getErr, course) => {
           if (getErr) return res.status(500).json({ error: getErr.message });
           
           res.json({
             message: 'Enrollment status updated successfully',
             course: course
           });
         });
       }
     );
   });
   ```

---

## 3. Order Verification & Post-Verification Logic (`backend/server.js`)

When an order is verified (both in mock checkout and live Razorpay checkout), the backend must perform two operations:
1. **Decrement inventory** for physical items (not courses).
2. **Generate receipts** in HTML and plain text formats and write them to `backend/logs/receipts/`.

### A. Environment Check in ESM
Because the project runs in ES Module (`"type": "module"` in `package.json`), variables like `__dirname` are not defined. We must import the necessary utility modules to resolve local directories.

Add at the top of `backend/server.js`:
```javascript
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
```

### B. Helper function: `processOrderPaymentVerification(order)`
This helper contains the core business logic. Running it safely handles SQLite updates and generates multi-format invoice files.

```javascript
async function processOrderPaymentVerification(order) {
  // 1. Parse Order Items
  const items = JSON.parse(order.items || '[]');
  
  // 2. Decrement product stock
  for (const item of items) {
    // Check if the item is a course (courses don't have physical inventory)
    if (!item.isCourse) {
      await new Promise((resolve, reject) => {
        db.run(
          'UPDATE products SET inventory = MAX(0, inventory - ?) WHERE id = ?',
          [item.quantity || 1, item.id],
          (err) => {
            if (err) {
              console.error(`Error decrementing stock for product ${item.id}:`, err.message);
              reject(err);
            } else {
              resolve();
            }
          }
        );
      });
    }
  }

  // 3. Generate HTML & Text Receipts
  try {
    const receiptsDir = path.resolve(__dirname, 'logs', 'receipts');
    if (!fs.existsSync(receiptsDir)) {
      fs.mkdirSync(receiptsDir, { recursive: true });
    }

    const receiptDate = new Date(order.created_at || Date.now()).toLocaleString();
    
    // Construct items section dynamically
    let itemRowsText = '';
    let itemRowsHtml = '';
    
    items.forEach((item, index) => {
      const typeLabel = item.isCourse ? 'Course' : 'Product';
      const qty = item.isCourse ? 1 : (item.quantity || 1);
      const subtotal = item.price * qty;
      
      itemRowsText += `${index + 1}. ${item.name} (${typeLabel})\n   Qty: ${qty} | Price: ₹${item.price} | Subtotal: ₹${subtotal}\n`;
      
      itemRowsHtml += `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.name} <span style="font-size: 0.8em; color: #666;">(${typeLabel})</span></td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">${qty}</td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">₹${item.price}</td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">₹${subtotal}</td>
        </tr>
      `;
    });

    // Create Text Receipt Format
    const textReceipt = `
=========================================
          AARINIYA WELLNESS RECEIPT
=========================================
Receipt Date   : ${receiptDate}
Order ID       : ${order.razorpay_order_id}
Payment ID     : ${order.razorpay_payment_id || 'N/A'}
Customer Name  : ${order.customer_name}
Email          : ${order.email}
Phone          : ${order.phone}
Address        : ${order.address}

-----------------------------------------
Items Purchased:
-----------------------------------------
${itemRowsText}
-----------------------------------------
Total Amount   : ₹${order.total_amount}
Payment Status : PAID
=========================================
    Thank you for choosing Aariniya!
=========================================
`;

    // Create HTML Receipt Format
    const htmlReceipt = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Aariniya Order Receipt - ${order.razorpay_order_id}</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #1c352d; margin: 0; padding: 20px; background-color: #f7f9f6; }
    .receipt-box { max-width: 600px; margin: auto; padding: 30px; border: 1px solid #e2e8f0; background: #fff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
    .header { text-align: center; border-bottom: 2px solid #1c352d; padding-bottom: 20px; }
    .header h1 { margin: 0; color: #1c352d; font-size: 24px; }
    .header p { margin: 5px 0 0; color: #666; font-size: 14px; }
    .details { margin: 20px 0; font-size: 14px; }
    .details table { width: 100%; }
    .details td { padding: 4px 0; }
    .details td.label { font-weight: bold; width: 120px; color: #1c352d; }
    .items-table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px; }
    .items-table th { background-color: #1c352d; color: #fff; padding: 10px; text-align: left; }
    .total-row { font-size: 16px; font-weight: bold; color: #1c352d; }
    .footer { text-align: center; margin-top: 45px; font-size: 12px; color: #666; border-top: 1px solid #eee; padding-top: 20px; }
  </style>
</head>
<body>
  <div class="receipt-box">
    <div class="header">
      <h1>AARINIYA</h1>
      <p>Nourishing Your Daily Wellness Ritual</p>
    </div>
    
    <div class="details">
      <table>
        <tr><td class="label">Date:</td><td>${receiptDate}</td></tr>
        <tr><td class="label">Order ID:</td><td>${order.razorpay_order_id}</td></tr>
        <tr><td class="label">Payment ID:</td><td>${order.razorpay_payment_id || 'N/A'}</td></tr>
        <tr><td class="label">Customer:</td><td>${order.customer_name}</td></tr>
        <tr><td class="label">Email:</td><td>${order.email}</td></tr>
        <tr><td class="label">Phone:</td><td>${order.phone}</td></tr>
        <tr><td class="label">Address:</td><td>${order.address}</td></tr>
      </table>
    </div>
    
    <table class="items-table">
      <thead>
        <tr>
          <th style="text-align: left;">Item</th>
          <th style="text-align: center; width: 60px;">Qty</th>
          <th style="text-align: right; width: 100px;">Price</th>
          <th style="text-align: right; width: 100px;">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${itemRowsHtml}
        <tr class="total-row">
          <td colspan="3" style="padding: 15px 10px 10px; text-align: right; border-top: 2px solid #1c352d;">Total:</td>
          <td style="padding: 15px 10px 10px; text-align: right; border-top: 2px solid #1c352d;">₹${order.total_amount}</td>
        </tr>
      </tbody>
    </table>
    
    <div class="footer">
      <p>Thank you for choosing AARINIYA. Your order is logged in our wellness register.</p>
      <p>&copy; 2026 Aariniya Platform. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;

    // Write text receipt
    const txtPath = path.join(receiptsDir, `receipt_${order.razorpay_order_id}.txt`);
    fs.writeFileSync(txtPath, textReceipt, 'utf8');

    // Write HTML receipt
    const htmlPath = path.join(receiptsDir, `receipt_${order.razorpay_order_id}.html`);
    fs.writeFileSync(htmlPath, htmlReceipt, 'utf8');

    console.log(`Receipts generated for order ${order.razorpay_order_id}.`);
  } catch (receiptErr) {
    console.error(`Error generating receipt for order ${order.razorpay_order_id}:`, receiptErr.message);
  }
}
```

### C. Integrating inside `/api/orders/verify`
In both mock signature and real signature branches, inside the query execution block where `payment_status` is updated to `'paid'`, we should trigger `processOrderPaymentVerification(order)` before executing response logic.

We make the DB query callback `async`:

```javascript
// Example integration for the Mock branch
db.run(query, [razorpay_payment_id, razorpay_order_id], function(err) {
  if (err) return res.status(500).json({ error: err.message });
  
  db.get('SELECT * FROM orders WHERE razorpay_order_id = ?', [razorpay_order_id], async (orderErr, order) => {
    if (orderErr) return res.status(500).json({ error: orderErr.message });
    
    // Wait for inventory decrement and receipt generation
    try {
      await processOrderPaymentVerification(order);
    } catch (procErr) {
      console.error("Order completion logic failed, continuing client response...", procErr);
    }
    
    return res.json({
      status: 'success',
      message: 'Payment verified successfully (Mock Mode)',
      order
    });
  });
});
```

Repeat this same integration block in the real Razorpay signature verification logic.

---

## 4. Verification & Testing Strategy

To verify this implementation once code is updated, the following checks must be performed:

### A. Manual Check
1. Start the backend: `npm run dev` or `npm run start` inside the `backend` folder.
2. Sign up a new user via API: `POST /api/auth/signup` with `{ "email": "test@aariniya.com", "password": "password123", "full_name": "Test User", "phone": "1234567890" }`.
   - Confirm that the response user structure contains `role: "user"`.
   - Inspect token contents (JWT) using a library or debugging tools to confirm `role: "user"` is signed in.
3. Access `/api/admin/dashboard-stats` using the standard token.
   - Confirm it returns `403 Forbidden` since the user has a `user` role.
4. Update the user role to `admin` in database using a SQLite terminal explorer, or sign up with `role: "admin"` (if custom testing key permitted), or log in as `admin@aariniya.com`.
5. Access `/api/admin/dashboard-stats` with the admin token.
   - Verify it successfully returns:
     ```json
     {
       "revenue": 0,
       "orderCount": 0,
       "activeOrders": []
     }
     ```
6. Simulate a purchase of `AARINIYA Deep Forest Multifloral Honey` (which starts with 100 stock).
   - Initiate checkout via `/api/orders/create` to get a mock order ID.
   - Verify payment via `/api/orders/verify` with `isMock: true`.
   - Check that the product stock decreases in SQLite (e.g. `SELECT inventory FROM products WHERE id = 1` returns 99).
   - Check that files `receipt_order_mock_*.txt` and `receipt_order_mock_*.html` exist inside `backend/logs/receipts/`.

### B. Integration Tests
To complete R3 (Automated E2E Testing) of Milestone 3, we will create `backend/tests/integration.test.js` or a separate integration testing script.
The script should automate the manual testing steps:
1. Boot the server on a test port (e.g. `5001`).
2. Make Axios calls to register a test admin.
3. Authenticate and confirm token contents.
4. Verify standard role restrictions block access to `/api/admin/*`.
5. Perform checkout of a product.
6. Verify payment and assert:
   - Stock level of product drops by 1.
   - Receipt folder contains the receipt file.
7. Terminate server and exit.
