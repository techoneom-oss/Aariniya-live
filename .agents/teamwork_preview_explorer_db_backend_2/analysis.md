# Implementation Analysis & Strategy Proposal: Database & Backend Core (Milestone 1)

This report details the implementation plan for the Database & Backend Core of the Aariniya wellness platform. The analysis covers the database migration strategy, authentication updates, administrative APIs, and order fulfillment actions (stock decrementing and receipt logging) in accordance with the project constraints and interfaces specified in `PROJECT.md`.

---

## 1. Database Schema Refactor & Seeding (`backend/database.js`)

SQLite does not support `ALTER TABLE ADD COLUMN` with complex operations easily, but we can utilize a safe schema check and update protocol during database initialization. This ensures that the schema updates run seamlessly even when an existing `aariniya.db` database file is present, without corrupting or deleting existing user data.

### 1.1 Users Table Modifications
We need to add a `role` field to the `users` table:
- **Column**: `role TEXT DEFAULT 'user'`
- **Constraint**: `CHECK(role IN ('user', 'admin'))`
- **Default**: `'user'`

### 1.2 Courses Table Modifications
We need to add an `enrollment_status` field to the `courses` table:
- **Column**: `enrollment_status TEXT DEFAULT 'open'`
- **Constraint**: `CHECK(enrollment_status IN ('open', 'closed'))`
- **Default**: `'open'`

### 1.3 Schema Migration Logic (Robust Upgrade Path)
To support upgrading an existing SQLite database dynamically, we insert standard SQLite column checks (`PRAGMA table_info`) into `initializeDatabase()`.

#### Proposed Code for `backend/database.js`:

##### Step 1: Imports (Top of file)
Add `bcryptjs` import to `database.js` to hash seeded user passwords.
```javascript
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs'; // New import
```

##### Step 2: Database Initialization and Seeding
Modify the user creation block and append the migration logic at the end of `initializeDatabase()`:

```javascript
// Inside initializeDatabase():

// 1. Users Table (Updated Schema definition)
db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT CHECK(role IN ('user', 'admin')) DEFAULT 'user',
    phone TEXT,
    address_line1 TEXT,
    address_line2 TEXT,
    city TEXT,
    state TEXT,
    postal_code TEXT,
    country TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`, () => {
  seedAdminUser();
});

// 4. Courses Table (Updated Schema definition)
db.run(`
  CREATE TABLE IF NOT EXISTS courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    subtitle TEXT,
    description TEXT,
    price REAL NOT NULL,
    type TEXT CHECK(type IN ('yoga', 'diet')),
    duration TEXT,
    image TEXT,
    enrollment_status TEXT CHECK(enrollment_status IN ('open', 'closed')) DEFAULT 'open'
  )
`, () => {
  seedCourses();
});

// Dynamic Migrations (Run immediately after table setups inside initializeDatabase)
db.serialize(() => {
  // Check users table for role column
  db.all("PRAGMA table_info(users)", (err, columns) => {
    if (err) return console.error("Failed to read user columns:", err);
    const hasRole = columns.some(col => col.name === 'role');
    if (!hasRole) {
      db.run("ALTER TABLE users ADD COLUMN role TEXT CHECK(role IN ('user', 'admin')) DEFAULT 'user'", (alterErr) => {
        if (alterErr) {
          console.error("Error migrating users table for role column:", alterErr.message);
        } else {
          console.log("Database Migration: Added 'role' column to users.");
          seedAdminUser();
        }
      });
    } else {
      seedAdminUser();
    }
  });

  // Check courses table for enrollment_status column
  db.all("PRAGMA table_info(courses)", (err, columns) => {
    if (err) return console.error("Failed to read course columns:", err);
    const hasStatus = columns.some(col => col.name === 'enrollment_status');
    if (!hasStatus) {
      db.run("ALTER TABLE courses ADD COLUMN enrollment_status TEXT CHECK(enrollment_status IN ('open', 'closed')) DEFAULT 'open'", (alterErr) => {
        if (alterErr) {
          console.error("Error migrating courses table for enrollment_status column:", alterErr.message);
        } else {
          console.log("Database Migration: Added 'enrollment_status' column to courses.");
        }
      });
    }
  });
});
```

##### Step 3: Seeding Administrator User
Add the `seedAdminUser` function helper at the bottom of `backend/database.js`:
```javascript
function seedAdminUser() {
  db.get("SELECT COUNT(*) as count FROM users WHERE role = 'admin'", (err, row) => {
    if (err) return console.error("Error verifying admin seed:", err);
    if (row.count === 0) {
      const email = 'admin@aariniya.com';
      const passwordHash = bcrypt.hashSync('admin123', 10);
      const fullName = 'Aariniya Administrator';
      const phone = '9999999999';
      
      db.run(
        `INSERT INTO users (email, password_hash, full_name, role, phone) VALUES (?, ?, ?, 'admin', ?)`,
        [email, passwordHash, fullName, phone],
        (insertErr) => {
          if (insertErr) console.error("Failed to seed administrator:", insertErr.message);
          else console.log("Seeding Success: Default admin user seeded (admin@aariniya.com / admin123).");
        }
      );
    }
  });
}
```

---

## 2. API Endpoints & Auth Refactor (`backend/server.js`)

In server.js, we must perform four changes: addition of standard imports, inclusion of `role` in the JWT tokens, verification middleware, and administration endpoints.

### 2.1 Necessary Imports (Top of file)
Ensure paths and system interfaces are imported:
```javascript
import fs from 'fs'; // Required for writing receipts
import path from 'path'; // Required for locating receipt folders
import { fileURLToPath } from 'url'; // Required for ES module pathing
```
Configure `__dirname` helper just after imports:
```javascript
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
```

### 2.2 JWT Payload Role Inclusion
We update the generated token and returned user payloads inside `/api/auth/signup` and `/api/auth/login`.

- **Signup Payload (`/api/auth/signup`)**:
  ```javascript
  // Line 67 replacement:
  const token = jwt.sign({ id: this.lastID, email, role: 'user' }, JWT_SECRET, { expiresIn: '24h' });
  
  // Line 72 response replacement:
  res.status(201).json({
    message: 'Signup successful',
    token,
    user: { id: this.lastID, email, full_name, role: 'user', phone: phone || '' }
  });
  ```

- **Login Payload (`/api/auth/login`)**:
  ```javascript
  // Line 91 replacement:
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
  
  // Line 96 response replacement:
  res.json({
    message: 'Login successful',
    token,
    user: {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role, // Added role field here
      phone: user.phone,
      address_line1: user.address_line1,
      address_line2: user.address_line2,
      city: user.city,
      state: user.state,
      postal_code: user.postal_code,
      country: user.country
    }
  });
  ```

### 2.3 `isAdmin` MiddleWare Definition
Place this middleware immediately below `authenticateToken` (line 38):
```javascript
const isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied: Administrator privileges required' });
  }
  next();
};
```

### 2.4 Administrative Endpoints (Implementation of Contracts)

#### 1. Admin Dashboard Stats Endpoint (`GET /api/admin/dashboard-stats`)
Calculates total sales, orders, and lists active orders.
```javascript
app.get('/api/admin/dashboard-stats', authenticateToken, isAdmin, (req, res) => {
  const revenueQuery = `SELECT SUM(total_amount) as revenue FROM orders WHERE payment_status = 'paid'`;
  const countQuery = `SELECT COUNT(*) as count FROM orders WHERE payment_status = 'paid'`;
  const activeOrdersQuery = `SELECT * FROM orders ORDER BY created_at DESC`;

  db.get(revenueQuery, [], (err, revRow) => {
    if (err) return res.status(500).json({ error: err.message });
    
    db.get(countQuery, [], (err, countRow) => {
      if (err) return res.status(500).json({ error: err.message });
      
      db.all(activeOrdersQuery, [], (err, orderRows) => {
        if (err) return res.status(500).json({ error: err.message });
        
        const parsedOrders = orderRows.map(o => ({
          ...o,
          address: JSON.parse(o.address || '{}'),
          items: JSON.parse(o.items || '[]')
        }));

        res.json({
          revenue: revRow.revenue || 0,
          orderCount: countRow.count || 0,
          activeOrders: parsedOrders
        });
      });
    });
  });
});
```

#### 2. Update Product stock/inventory Endpoint (`PUT /api/admin/products/:id/inventory`)
Allows modifying product stock.
```javascript
app.put('/api/admin/products/:id/inventory', authenticateToken, isAdmin, (req, res) => {
  const { inventory } = req.body;
  const productId = req.params.id;

  if (inventory === undefined || isNaN(Number(inventory)) || Number(inventory) < 0) {
    return res.status(400).json({ error: 'Valid inventory quantity is required' });
  }

  db.run('UPDATE products SET inventory = ? WHERE id = ?', [Number(inventory), productId], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Product not found' });

    db.get('SELECT * FROM products WHERE id = ?', [productId], (err, product) => {
      if (err) return res.status(500).json({ error: err.message });
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
  });
});
```

#### 3. Update Course Status Endpoint (`PUT /api/admin/courses/:id/enrollment`)
Allows modifying course enrollment status.
```javascript
app.put('/api/admin/courses/:id/enrollment', authenticateToken, isAdmin, (req, res) => {
  const { enrollment_status } = req.body;
  const courseId = req.params.id;

  if (!enrollment_status || !['open', 'closed'].includes(enrollment_status)) {
    return res.status(400).json({ error: "Enrollment status must be either 'open' or 'closed'" });
  }

  db.run('UPDATE courses SET enrollment_status = ? WHERE id = ?', [enrollment_status, courseId], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Course not found' });

    db.get('SELECT * FROM courses WHERE id = ?', [courseId], (err, course) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({
        message: 'Enrollment status updated successfully',
        course
      });
    });
  });
});
```

---

## 3. Order Fulfillment Business Logic (`backend/server.js`)

When an order payment is verified successfully in `/api/orders/verify`, the backend must automatically decrement the stock of physical products in the order and generate formatted transaction receipts (in both plain text and HTML layout).

### 3.1 Decrement Stock & Receipt Generation Handler
Add this helper function in `backend/server.js`:

```javascript
const handleOrderFulfillment = (order, callback) => {
  let items = [];
  try {
    items = JSON.parse(order.items || '[]');
  } catch (e) {
    console.error("Error parsing order items for stock update:", e);
    return callback(e);
  }

  // 1. Asynchronous Loop to Decrement Product Inventory in SQLite
  const decrementStockSeq = (index, next) => {
    if (index >= items.length) {
      return next();
    }
    
    const item = items[index];
    // Check if the item is a physical product (courses do not have inventory)
    if (!item.isCourse) {
      const qty = item.quantity || 1;
      const prodId = item.id;
      
      db.run(
        'UPDATE products SET inventory = MAX(0, inventory - ?) WHERE id = ?',
        [qty, prodId],
        (err) => {
          if (err) {
            console.error(`Failed to update stock for product ID ${prodId}:`, err.message);
          }
          decrementStockSeq(index + 1, next);
        }
      );
    } else {
      decrementStockSeq(index + 1, next);
    }
  };

  // Run stock updates sequentially, then write receipt
  decrementStockSeq(0, () => {
    try {
      const receiptsDir = path.resolve(__dirname, 'logs', 'receipts');
      if (!fs.existsSync(receiptsDir)) {
        fs.mkdirSync(receiptsDir, { recursive: true });
      }

      const orderId = order.razorpay_order_id;
      const txtReceiptPath = path.join(receiptsDir, `receipt_${orderId}.txt`);
      const htmlReceiptPath = path.join(receiptsDir, `receipt_${orderId}.html`);

      // Text Receipt Content
      const textReceipt = `AARINIYA WELLNESS PLATFORM - ORDER RECEIPT
==========================================
Order ID: ${order.razorpay_order_id}
Payment ID: ${order.razorpay_payment_id || 'N/A'}
Date: ${new Date(order.created_at || Date.now()).toLocaleString()}

Customer Details:
-----------------
Name: ${order.customer_name}
Email: ${order.email}
Phone: ${order.phone}
Address: ${order.address}

Items Purchased:
----------------
${items.map(item => `- ${item.name} (${item.isCourse ? 'Course' : 'Product'}, Qty: ${item.quantity || 1}) - INR ${(item.price * (item.quantity || 1)).toFixed(2)}`).join('\n')}

==========================================
Total Paid: INR ${order.total_amount.toFixed(2)}
Thank you for choosing Aariniya!`;

      // HTML Receipt Content
      const htmlReceipt = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Receipt for Order ${order.razorpay_order_id}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
    .receipt-box { border: 1px solid #eee; padding: 30px; max-width: 600px; margin: auto; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
    .header { text-align: center; border-bottom: 2px solid #5a6b5c; padding-bottom: 20px; }
    .logo { font-size: 24px; font-weight: bold; color: #5a6b5c; }
    .details { margin: 20px 0; }
    .details table { width: 100%; }
    .details td { padding: 5px 0; }
    .items-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    .items-table th, .items-table td { border: 1px solid #ddd; padding: 10px; text-align: left; }
    .items-table th { background-color: #f9f9f9; }
    .total { text-align: right; margin-top: 20px; font-size: 18px; font-weight: bold; color: #5a6b5c; }
    .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #777; }
  </style>
</head>
<body>
  <div class="receipt-box">
    <div class="header">
      <div class="logo">AARINIYA</div>
      <p>Holistic Wellness & Pure Forest Honey</p>
    </div>
    <div class="details">
      <h3>Order Details</h3>
      <table>
        <tr><td><strong>Order ID:</strong></td><td>${order.razorpay_order_id}</td></tr>
        <tr><td><strong>Payment ID:</strong></td><td>${order.razorpay_payment_id || 'N/A'}</td></tr>
        <tr><td><strong>Date:</strong></td><td>${new Date(order.created_at || Date.now()).toLocaleString()}</td></tr>
        <tr><td><strong>Customer Name:</strong></td><td>${order.customer_name}</td></tr>
        <tr><td><strong>Email:</strong></td><td>${order.email}</td></tr>
        <tr><td><strong>Phone:</strong></td><td>${order.phone}</td></tr>
        <tr><td><strong>Shipping Address:</strong></td><td>${order.address}</td></tr>
      </table>
    </div>
    
    <h3>Items</h3>
    <table class="items-table">
      <thead>
        <tr>
          <th>Item Name</th>
          <th>Type</th>
          <th>Qty</th>
          <th>Price</th>
          <th>Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${items.map(item => `
          <tr>
            <td>${item.name}</td>
            <td>${item.isCourse ? 'Course' : 'Product'}</td>
            <td>${item.quantity || 1}</td>
            <td>INR ${item.price}</td>
            <td>INR ${(item.price * (item.quantity || 1)).toFixed(2)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    
    <div class="total">
      Total Paid: INR ${order.total_amount.toFixed(2)}
    </div>
    
    <div class="footer">
      <p>Thank you for supporting sustainable forest harvesting and clean living.</p>
      <p>&copy; 2026 Aariniya Wellness. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;

      // Async write of both receipt files
      fs.writeFile(txtReceiptPath, textReceipt.trim(), 'utf8', (err) => {
        if (err) console.error("Error writing text receipt:", err.message);
        
        fs.writeFile(htmlReceiptPath, htmlReceipt.trim(), 'utf8', (err) => {
          if (err) console.error("Error writing html receipt:", err.message);
          
          callback(null); // Complete execution chain
        });
      });
    } catch (e) {
      console.error("Fulfillment write execution error:", e.message);
      callback(e);
    }
  });
};
```

### 3.2 Verification Route Updates
We integrate `handleOrderFulfillment` into `/api/orders/verify` in both the Mock and Sandbox/Production routes.

- **Mock Verification Handler updates (lines 316-324)**:
  ```javascript
  db.get('SELECT * FROM orders WHERE razorpay_order_id = ?', [razorpay_order_id], (orderErr, order) => {
    if (orderErr) return res.status(500).json({ error: orderErr.message });
    
    handleOrderFulfillment(order, (fullErr) => {
      // Regardless of receipt write status, return success to clear frontend state
      if (fullErr) console.error("Receipt writing failed:", fullErr.message);
      
      return res.json({
        status: 'success',
        message: 'Payment verified successfully (Mock Mode)',
        order
      });
    });
  });
  ```

- **Production Verification Handler updates (lines 343-351)**:
  ```javascript
  db.get('SELECT * FROM orders WHERE razorpay_order_id = ?', [razorpay_order_id], (orderErr, order) => {
    if (orderErr) return res.status(500).json({ error: orderErr.message });
    
    handleOrderFulfillment(order, (fullErr) => {
      if (fullErr) console.error("Receipt writing failed:", fullErr.message);
      
      res.json({
        status: 'success',
        message: 'Payment verified successfully',
        order
      });
    });
  });
  ```

---

## 4. Summary of Proposed Changes

| Target File | Scope of Edit | Purpose | Interface Conformance |
|---|---|---|---|
| `backend/database.js` | Schema initialization, seeding, dynamic migration queries. | Adds `role` and `enrollment_status` schema safety; seeds admin account. | Matches database schema needs for Milestone 1. |
| `backend/server.js` | Middleware, token structure, and routes. | Implements `/api/admin/dashboard-stats`, `/api/admin/products/:id/inventory`, and `/api/admin/courses/:id/enrollment`. | Conforms to definitions inside `PROJECT.md` contracts. |
| `backend/server.js` | Order confirmation callback. | Decrements inventory and logs HTML/text receipts to `logs/receipts/`. | Saves formatted receipts as system artifacts. |

---

## 5. Verification Plan

After implementation, verification should perform:
1. **Schema Check**: Confirm tables have the new columns. Run `sqlite3 backend/aariniya.db ".schema users"` and inspect the schema output.
2. **Admin Auth Check**: Log in as `admin@aariniya.com` using password `admin123` to obtain a JWT. Verify that the response payload and JWT contains `role: 'admin'`.
3. **Endpoint Validation**: Query `/api/admin/dashboard-stats` using the admin token. Check that the returns match `{ revenue, orderCount, activeOrders }`.
4. **Order and Stock Flow Check**: Perform a checkout with a product. Confirm that order verification decrements product stock in `products` and creates `receipt_<order_id>.txt` & `receipt_<order_id>.html` in `backend/logs/receipts/`.
