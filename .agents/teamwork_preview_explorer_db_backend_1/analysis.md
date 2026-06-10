# Milestone 1: Database & Backend Core - Analysis and Proposed Implementation Strategy

This report outlines the technical strategy for implementing **Milestone 1: Database & Backend Core** for the Aariniya wellness brand platform.

---

## 1. Database Schema Enhancements (`backend/database.js`)

### Column Additions
1. **Users Table**: Add a `role` column defaulting to `'user'`.
   - **SQL Change**: `role TEXT DEFAULT 'user' CHECK(role IN ('user', 'admin'))`
2. **Courses Table**: Add an `enrollment_status` column defaulting to `'open'`.
   - **SQL Change**: `enrollment_status TEXT DEFAULT 'open' CHECK(enrollment_status IN ('open', 'closed'))`

### Seeding Admin User
To support administrative actions and enable initial login, a default administrator account should be seeded if no admin user is present:
- **Default Credentials**: `admin@aariniya.com` / `admin123_secure`
- **Methodology**: Add an import for `bcryptjs` at the top of `backend/database.js`. Hash the password on startup and insert the admin user with `'admin'` role in a callback when the users table is created.

### Database Compatibility & Automatic Migrations
To ensure the server runs successfully on environments with existing `aariniya.db` databases without requiring manual schema deletion, the initialization code should run simple `ALTER TABLE` statements inside `initializeDatabase()`.
```javascript
db.run("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'", () => {});
db.run("ALTER TABLE courses ADD COLUMN enrollment_status TEXT DEFAULT 'open'", () => {});
```
SQLite will safely ignore these calls if the columns already exist, providing robust backward compatibility.

---

## 2. Authentication & JWT Enhancements (`backend/server.js`)

To enable role-based route protection:
1. **JWT Generation on Signup**:
   - Update `jwt.sign()` payload to include `role: 'user'`.
   - Return `role: 'user'` in the user response details.
2. **JWT Generation on Login**:
   - Update `jwt.sign()` payload to include `role: user.role` (retrieved from database).
   - Return `role: user.role` in the user details response block (this directly maps to frontend `localStorage.aariniya_user` parsing).
3. **Get Profile Endpoint**:
   - Update the SQL query in `/api/user/profile` to select the `role` column:
     `SELECT id, email, full_name, phone, address_line1, address_line2, city, state, postal_code, country, role FROM users WHERE id = ?`

---

## 3. Admin Check Middleware & Endpoints (`backend/server.js`)

### Admin Verification Middleware
The `isAdmin` middleware extracts and inspects the token payload parsed by `authenticateToken`.
```javascript
const isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }
  next();
};
```

### Endpoints to Add

#### A. Admin Dashboard Stats
- **Endpoint**: `GET /api/admin/dashboard-stats`
- **Security**: `authenticateToken, isAdmin`
- **Logic**: Fetch all orders with `payment_status = 'paid'` to compute total revenue and order counts, returning them alongside parsed items and shipping data in the `activeOrders` array.
```javascript
app.get('/api/admin/dashboard-stats', authenticateToken, isAdmin, (req, res) => {
  db.all("SELECT * FROM orders WHERE payment_status = 'paid' ORDER BY created_at DESC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    
    const revenue = rows.reduce((sum, row) => sum + row.total_amount, 0);
    const orderCount = rows.length;
    const activeOrders = rows.map(o => ({
      ...o,
      address: JSON.parse(o.address || '{}'),
      items: JSON.parse(o.items || '[]')
    }));
    
    res.json({ revenue, orderCount, activeOrders });
  });
});
```

#### B. Update Product Stock
- **Endpoint**: `PUT /api/admin/products/:id/inventory`
- **Security**: `authenticateToken, isAdmin`
- **Logic**: Set the product inventory, checking for invalid inputs, then return the parsed, updated product.
```javascript
app.put('/api/admin/products/:id/inventory', authenticateToken, isAdmin, (req, res) => {
  const { id } = req.params;
  const { inventory } = req.body;

  if (inventory === undefined || isNaN(inventory) || parseInt(inventory) < 0) {
    return res.status(400).json({ error: 'Inventory must be a non-negative number' });
  }

  db.run('UPDATE products SET inventory = ? WHERE id = ?', [parseInt(inventory), id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Product not found' });

    db.get('SELECT * FROM products WHERE id = ?', [id], (getErr, product) => {
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
  });
});
```

#### C. Update Course Enrollment Status
- **Endpoint**: `PUT /api/admin/courses/:id/enrollment`
- **Security**: `authenticateToken, isAdmin`
- **Logic**: Validate and update enrollment status between `'open'` and `'closed'`.
```javascript
app.put('/api/admin/courses/:id/enrollment', authenticateToken, isAdmin, (req, res) => {
  const { id } = req.params;
  const { enrollment_status } = req.body;

  if (!enrollment_status || (enrollment_status !== 'open' && enrollment_status !== 'closed')) {
    return res.status(400).json({ error: "Enrollment status must be either 'open' or 'closed'" });
  }

  db.run('UPDATE courses SET enrollment_status = ? WHERE id = ?', [enrollment_status, id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Course not found' });

    db.get('SELECT * FROM courses WHERE id = ?', [id], (getErr, course) => {
      if (getErr) return res.status(500).json({ error: getErr.message });
      res.json({
        message: 'Enrollment status updated successfully',
        course
      });
    });
  });
});
```

---

## 4. Post-Verification Order Fulfillment Logic (`backend/server.js`)

When payment is successfully verified inside `POST /api/orders/verify` (both for mock and live Razorpay transactions), the server should update inventory and write receipt documents.

### File System Imports
Add these imports at the top of `backend/server.js` to manage receipt writing:
```javascript
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
```

### Flow Execution Helper
Invoke a centralized helper function immediately after retrieving the database order object under a `'paid'` status query.

```javascript
function processSuccessfulOrder(order) {
  let items = [];
  try {
    items = JSON.parse(order.items || '[]');
  } catch (e) {
    console.error("Failed to parse items for order fulfillment:", e);
    return;
  }

  // 1. Decrement inventory for physical products only (skip courses)
  const productItems = items.filter(item => !item.isCourse);
  productItems.forEach(item => {
    db.run(
      'UPDATE products SET inventory = MAX(0, inventory - ?) WHERE id = ?',
      [item.quantity || 1, item.id],
      (err) => {
        if (err) console.error(`Failed to decrement inventory for product ID ${item.id}:`, err);
      }
    );
  });

  // 2. Generate and write receipt files
  writeReceiptFiles(order, items);
}
```

### Receipt Writing Logic
Writes an HTML formatted receipt and a plain text receipt into `backend/logs/receipts/`.

```javascript
function writeReceiptFiles(order, items) {
  const receiptsDir = path.join(__dirname, 'logs', 'receipts');
  if (!fs.existsSync(receiptsDir)) {
    fs.mkdirSync(receiptsDir, { recursive: true });
  }

  let parsedAddress = '';
  try {
    parsedAddress = JSON.parse(order.address);
  } catch (e) {
    parsedAddress = order.address || '';
  }

  // Build items rows/strings
  let itemsListHTML = '';
  let itemsListText = '';

  items.forEach(item => {
    const total = item.price * item.quantity;
    const type = item.isCourse ? 'Course' : 'Product';
    
    itemsListHTML += `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid rgba(28, 53, 45, 0.08);">
          <strong>${item.name}</strong><br><span style="font-size: 11px; color: #666;">${type}</span>
        </td>
        <td style="padding: 10px; border-bottom: 1px solid rgba(28, 53, 45, 0.08);">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid rgba(28, 53, 45, 0.08);">₹${item.price}</td>
        <td style="padding: 10px; border-bottom: 1px solid rgba(28, 53, 45, 0.08);">₹${total}</td>
      </tr>
    `;
    
    itemsListText += `- ${item.name} (${type}) x${item.quantity} - ₹${item.price} (Subtotal: ₹${total})\n`;
  });

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Aariniya Receipt - Order ${order.razorpay_order_id}</title>
  <style>
    body { font-family: 'Georgia', serif; color: #1c352d; background-color: #fcfbfa; padding: 20px; }
    .receipt-container { max-width: 600px; margin: 0 auto; background: #ffffff; padding: 30px; border-radius: 8px; border: 1px solid rgba(28, 53, 45, 0.1); }
    .header { text-align: center; border-bottom: 2px solid #1c352d; padding-bottom: 20px; margin-bottom: 20px; }
    .header h1 { margin: 0; font-size: 24px; color: #1c352d; letter-spacing: 2px; }
    .header p { margin: 5px 0 0 0; font-style: italic; color: #666; }
    .details-table, .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    .details-table td { padding: 4px 0; font-size: 14px; }
    .details-table td.label { font-weight: bold; width: 120px; }
    .items-table th { background-color: #1c352d; color: #ffffff; text-align: left; padding: 10px; font-size: 14px; }
    .total-row { font-weight: bold; font-size: 16px; }
    .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; border-top: 1px solid rgba(28, 53, 45, 0.1); padding-top: 15px; }
  </style>
</head>
<body>
  <div class="receipt-container">
    <div class="header">
      <h1>AARINIYA</h1>
      <p>Nature's Sweetest Ritual</p>
    </div>
    <h3>Order Receipt</h3>
    <table class="details-table">
      <tr><td class="label">Order ID:</td><td>${order.razorpay_order_id}</td></tr>
      <tr><td class="label">Payment ID:</td><td>${order.razorpay_payment_id}</td></tr>
      <tr><td class="label">Date:</td><td>${new Date(order.created_at).toLocaleString()}</td></tr>
      <tr><td class="label">Customer:</td><td>${order.customer_name}</td></tr>
      <tr><td class="label">Email:</td><td>${order.email}</td></tr>
      <tr><td class="label">Phone:</td><td>${order.phone}</td></tr>
      <tr><td class="label">Address:</td><td>${parsedAddress}</td></tr>
    </table>
    <table class="items-table">
      <thead>
        <tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr>
      </thead>
      <tbody>
        ${itemsListHTML}
        <tr class="total-row">
          <td colspan="3" style="text-align: right; padding-top: 15px;">Grand Total:</td>
          <td style="padding-top: 15px;">₹${order.total_amount}</td>
        </tr>
      </tbody>
    </table>
    <div class="footer">
      <p>Thank you for choosing AARINIYA.</p>
    </div>
  </div>
</body>
</html>`;

  const textContent = `==================================================
                   AARINIYA                       
           Nature's Sweetest Ritual               
==================================================

ORDER RECEIPT
--------------------------------------------------
Order ID:      ${order.razorpay_order_id}
Payment ID:    ${order.razorpay_payment_id}
Date:          ${new Date(order.created_at).toLocaleString()}
Customer Name: ${order.customer_name}
Email:         ${order.email}
Phone:         ${order.phone}
Shipping:      ${parsedAddress}
--------------------------------------------------

ITEMS PURCHASED:
--------------------------------------------------
${itemsListText}
--------------------------------------------------
Grand Total:   ₹${order.total_amount}
--------------------------------------------------

Thank you for choosing AARINIYA.
==================================================`;

  const htmlPath = path.join(receiptsDir, `receipt_${order.razorpay_order_id}.html`);
  const txtPath = path.join(receiptsDir, `receipt_${order.razorpay_order_id}.txt`);

  fs.writeFileSync(htmlPath, htmlContent, 'utf8');
  fs.writeFileSync(txtPath, textContent, 'utf8');
  console.log(`Receipts saved to filesystem for order ${order.razorpay_order_id}`);
}
```

---

## 5. Detailed Proposed Patch Files

Below are the exact Git patches that can be applied to implement these changes.

### A. Proposed Code Changes for `backend/database.js`
```patch
diff --git a/backend/database.js b/backend/database.js
index aa43bb9..cc87da3 100644
--- a/backend/database.js
+++ b/backend/database.js
@@ -2,6 +2,7 @@ import sqlite3 from 'sqlite3';
 import path from 'path';
 import { fileURLToPath } from 'url';
+import bcrypt from 'bcryptjs';
 
 const __filename = fileURLToPath(import.meta.url);
 const __dirname = path.dirname(__filename);
@@ -32,9 +33,14 @@ function initializeDatabase() {
         state TEXT,
         postal_code TEXT,
         country TEXT,
+        role TEXT DEFAULT 'user' CHECK(role IN ('user', 'admin')),
         created_at DATETIME DEFAULT CURRENT_TIMESTAMP
       )
-    `);
+    `, () => {
+      seedAdminUser();
+      // Run migration altering table if column wasn't there
+      db.run("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'", () => {});
+    });
 
     // 2. Products Table
     db.run(`
@@ -83,9 +89,13 @@ function initializeDatabase() {
         description TEXT,
         price REAL NOT NULL,
         type TEXT CHECK(type IN ('yoga', 'diet')),
         duration TEXT,
-        image TEXT
+        image TEXT,
+        enrollment_status TEXT DEFAULT 'open' CHECK(enrollment_status IN ('open', 'closed'))
       )
     `, () => {
       seedCourses();
+      // Run migration altering table if column wasn't there
+      db.run("ALTER TABLE courses ADD COLUMN enrollment_status TEXT DEFAULT 'open'", () => {});
     });
 
     // 5. Orders Table
@@ -113,6 +123,26 @@ function initializeDatabase() {
   });
 }
 
+function seedAdminUser() {
+  db.get("SELECT COUNT(*) as count FROM users WHERE role = 'admin'", (err, row) => {
+    if (err) return console.error(err);
+    if (row.count === 0) {
+      const email = 'admin@aariniya.com';
+      const password = 'admin123_secure';
+      const salt = bcrypt.genSaltSync(10);
+      const passwordHash = bcrypt.hashSync(password, salt);
+      
+      const stmt = db.prepare(`
+        INSERT INTO users (email, password_hash, full_name, role)
+        VALUES (?, ?, ?, 'admin')
+      `);
+      stmt.run(email, passwordHash, 'Aariniya Admin', (runErr) => {
+        if (runErr) console.error("Error seeding admin user", runErr);
+      });
+      stmt.finalize();
+    }
+  });
+}
+
 function seedProducts() {
   db.get("SELECT COUNT(*) as count FROM products", (err, row) => {
```

### B. Proposed Code Changes for `backend/server.js`
```patch
diff --git a/backend/server.js b/backend/server.js
index b825e6e..cb44321 100644
--- a/backend/server.js
+++ b/backend/server.js
@@ -5,6 +5,9 @@ import jwt from 'jsonwebtoken';
 import Razorpay from 'razorpay';
 import crypto from 'crypto';
 import db from './database.js';
+import fs from 'fs';
+import path from 'path';
+import { fileURLToPath } from 'url';
 
 dotenv.config();
 
@@ -12,6 +15,9 @@ const app = express();
 const PORT = process.env.PORT || 5000;
 const JWT_SECRET = process.env.JWT_SECRET || 'aariniya_secret_key_987654321';
 
+const __filename = fileURLToPath(import.meta.url);
+const __dirname = path.dirname(__filename);
+
 // Setup Razorpay instance
 // In standard test mode, you can use these fallback test credentials if environment variables aren't provided.
 const razorpay = new Razorpay({
@@ -37,6 +43,14 @@ const authenticateToken = (req, res, next) => {
   });
 };
 
+const isAdmin = (req, res, next) => {
+  if (!req.user || req.user.role !== 'admin') {
+    return res.status(403).json({ error: 'Forbidden: Admin access required' });
+  }
+  next();
+};
+
 // --- AUTH ROUTES ---
 
 // Signup
@@ -64,12 +78,12 @@ app.post('/api/auth/signup', (req, res) => {
     }
     
     // Generate token
-    const token = jwt.sign({ id: this.lastID, email }, JWT_SECRET, { expiresIn: '24h' });
+    const token = jwt.sign({ id: this.lastID, email, role: 'user' }, JWT_SECRET, { expiresIn: '24h' });
     
     res.status(201).json({
       message: 'Signup successful',
       token,
-      user: { id: this.lastID, email, full_name, phone: phone || '' }
+      user: { id: this.lastID, email, full_name, phone: phone || '', role: 'user' }
     });
   });
 });
@@ -88,14 +102,15 @@ app.post('/api/auth/login', (req, res) => {
     const validPassword = bcrypt.compareSync(password, user.password_hash);
     if (!validPassword) return res.status(401).json({ error: 'Invalid email or password' });
 
-    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
+    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
 
     res.json({
       message: 'Login successful',
       token,
       user: {
         id: user.id,
         email: user.email,
         full_name: user.full_name,
         phone: user.phone,
         address_line1: user.address_line1,
         address_line2: user.address_line2,
         city: user.city,
         state: user.state,
         postal_code: user.postal_code,
-        country: user.country
+        country: user.country,
+        role: user.role
       }
     });
   });
 });
@@ -112,8 +127,8 @@ app.post('/api/auth/login', (req, res) => {
 
 // Get Profile
 app.get('/api/user/profile', authenticateToken, (req, res) => {
-  db.get('SELECT id, email, full_name, phone, address_line1, address_line2, city, state, postal_code, country FROM users WHERE id = ?', [req.user.id], (err, user) => {
+  db.get('SELECT id, email, full_name, phone, address_line1, address_line2, city, state, postal_code, country, role FROM users WHERE id = ?', [req.user.id], (err, user) => {
     if (err) return res.status(500).json({ error: err.message });
     if (!user) return res.status(404).json({ error: 'User not found' });
     res.json(user);
   });
@@ -226,6 +241,75 @@ app.get('/api/courses', (req, res) => {
   });
 });
 
+// --- ADMIN ROUTES ---
+
+app.get('/api/admin/dashboard-stats', authenticateToken, isAdmin, (req, res) => {
+  db.all("SELECT * FROM orders WHERE payment_status = 'paid' ORDER BY created_at DESC", [], (err, rows) => {
+    if (err) return res.status(500).json({ error: err.message });
+    const revenue = rows.reduce((sum, row) => sum + row.total_amount, 0);
+    const orderCount = rows.length;
+    const activeOrders = rows.map(o => ({
+      ...o,
+      address: JSON.parse(o.address || '{}'),
+      items: JSON.parse(o.items || '[]')
+    }));
+    res.json({ revenue, orderCount, activeOrders });
+  });
+});
+
+app.put('/api/admin/products/:id/inventory', authenticateToken, isAdmin, (req, res) => {
+  const { id } = req.params;
+  const { inventory } = req.body;
+  if (inventory === undefined || isNaN(inventory) || parseInt(inventory) < 0) {
+    return res.status(400).json({ error: 'Inventory must be a non-negative number' });
+  }
+  db.run('UPDATE products SET inventory = ? WHERE id = ?', [parseInt(inventory), id], function(err) {
+    if (err) return res.status(500).json({ error: err.message });
+    if (this.changes === 0) return res.status(404).json({ error: 'Product not found' });
+    db.get('SELECT * FROM products WHERE id = ?', [id], (getErr, product) => {
+      if (getErr) return res.status(500).json({ error: getErr.message });
+      res.json({
+        message: 'Inventory updated successfully',
+        product: {
+          ...product,
+          highlights: JSON.parse(product.highlights || '[]'),
+          taste_profile: JSON.parse(product.taste_profile || '{}'),
+          ways_to_enjoy: JSON.parse(product.ways_to_enjoy || '[]'),
+          details: JSON.parse(product.details || '{}'),
+          who_is_it_for: JSON.parse(product.who_is_it_for || '[]'),
+          images: JSON.parse(product.images || '[]')
+        }
+      });
+    });
+  });
+});
+
+app.put('/api/admin/courses/:id/enrollment', authenticateToken, isAdmin, (req, res) => {
+  const { id } = req.params;
+  const { enrollment_status } = req.body;
+  if (!enrollment_status || (enrollment_status !== 'open' && enrollment_status !== 'closed')) {
+    return res.status(400).json({ error: "Enrollment status must be either 'open' or 'closed'" });
+  }
+  db.run('UPDATE courses SET enrollment_status = ? WHERE id = ?', [enrollment_status, id], function(err) {
+    if (err) return res.status(500).json({ error: err.message });
+    if (this.changes === 0) return res.status(404).json({ error: 'Course not found' });
+    db.get('SELECT * FROM courses WHERE id = ?', [id], (getErr, course) => {
+      if (getErr) return res.status(500).json({ error: getErr.message });
+      res.json({
+        message: 'Enrollment status updated successfully',
+        course
+      });
+    });
+  });
+});
+
 // --- RAZORPAY & ORDER FLOW ROUTES ---
 
 // Create Order (Initiate Checkout)
@@ -311,8 +395,9 @@ app.post('/api/orders/verify', (req, res) => {
     db.run(query, [razorpay_payment_id, razorpay_order_id], function(err) {
       if (err) return res.status(500).json({ error: err.message });
       
       db.get('SELECT * FROM orders WHERE razorpay_order_id = ?', [razorpay_order_id], (orderErr, order) => {
         if (orderErr) return res.status(500).json({ error: orderErr.message });
+        processSuccessfulOrder(order);
         return res.json({
           status: 'success',
           message: 'Payment verified successfully (Mock Mode)',
@@ -342,6 +427,7 @@ app.post('/api/orders/verify', (req, res) => {
         db.get('SELECT * FROM orders WHERE razorpay_order_id = ?', [razorpay_order_id], (orderErr, order) => {
           if (orderErr) return res.status(500).json({ error: orderErr.message });
+          processSuccessfulOrder(order);
           res.json({
             status: 'success',
             message: 'Payment verified successfully',
@@ -363,6 +449,122 @@ app.post('/api/orders/verify', (req, res) => {
   }
 });
 
+function processSuccessfulOrder(order) {
+  let items = [];
+  try {
+    items = JSON.parse(order.items || '[]');
+  } catch (e) {
+    console.error("Failed to parse items for order fulfillment:", e);
+    return;
+  }
+
+  // 1. Decrement inventory for physical products
+  const productItems = items.filter(item => !item.isCourse);
+  productItems.forEach(item => {
+    db.run(
+      'UPDATE products SET inventory = MAX(0, inventory - ?) WHERE id = ?',
+      [item.quantity || 1, item.id],
+      (err) => {
+        if (err) console.error(`Failed to decrement inventory for product ID ${item.id}:`, err);
+      }
+    );
+  });
+
+  // 2. Generate and write receipt files
+  writeReceiptFiles(order, items);
+}
+
+function writeReceiptFiles(order, items) {
+  const receiptsDir = path.join(__dirname, 'logs', 'receipts');
+  if (!fs.existsSync(receiptsDir)) {
+    fs.mkdirSync(receiptsDir, { recursive: true });
+  }
+
+  let parsedAddress = '';
+  try {
+    parsedAddress = JSON.parse(order.address);
+  } catch (e) {
+    parsedAddress = order.address || '';
+  }
+
+  let itemsListHTML = '';
+  let itemsListText = '';
+
+  items.forEach(item => {
+    const total = item.price * item.quantity;
+    const type = item.isCourse ? 'Course' : 'Product';
+    
+    itemsListHTML += `
+      <tr>
+        <td style="padding: 10px; border-bottom: 1px solid rgba(28, 53, 45, 0.08);">
+          <strong>${item.name}</strong><br><span style="font-size: 11px; color: #666;">${type}</span>
+        </td>
+        <td style="padding: 10px; border-bottom: 1px solid rgba(28, 53, 45, 0.08);">${item.quantity}</td>
+        <td style="padding: 10px; border-bottom: 1px solid rgba(28, 53, 45, 0.08);">₹${item.price}</td>
+        <td style="padding: 10px; border-bottom: 1px solid rgba(28, 53, 45, 0.08);">₹${total}</td>
+      </tr>
+    `;
+    
+    itemsListText += `- ${item.name} (${type}) x${item.quantity} - ₹${item.price} (Subtotal: ₹${total})\\n`;
+  });
+
+  const htmlContent = \`<!DOCTYPE html>
+<html lang="en">
+<head>
+  <meta charset="UTF-8">
+  <title>Aariniya Receipt - Order \${order.razorpay_order_id}</title>
+  <style>
+    body { font-family: 'Georgia', serif; color: #1c352d; background-color: #fcfbfa; padding: 20px; }
+    .receipt-container { max-width: 600px; margin: 0 auto; background: #ffffff; padding: 30px; border-radius: 8px; border: 1px solid rgba(28, 53, 45, 0.1); }
+    .header { text-align: center; border-bottom: 2px solid #1c352d; padding-bottom: 20px; margin-bottom: 20px; }
+    .header h1 { margin: 0; font-size: 24px; color: #1c352d; letter-spacing: 2px; }
+    .header p { margin: 5px 0 0 0; font-style: italic; color: #666; }
+    .details-table, .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
+    .details-table td { padding: 4px 0; font-size: 14px; }
+    .details-table td.label { font-weight: bold; width: 120px; }
+    .items-table th { background-color: #1c352d; color: #ffffff; text-align: left; padding: 10px; font-size: 14px; }
+    .total-row { font-weight: bold; font-size: 16px; }
+    .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; border-top: 1px solid rgba(28, 53, 45, 0.1); padding-top: 15px; }
+  </style>
+</head>
+<body>
+  <div class="receipt-container">
+    <div class="header">
+      <h1>AARINIYA</h1>
+      <p>Nature's Sweetest Ritual</p>
+    </div>
+    <h3>Order Receipt</h3>
+    <table class="details-table">
+      <tr><td class="label">Order ID:</td><td>\${order.razorpay_order_id}</td></tr>
+      <tr><td class="label">Payment ID:</td><td>\${order.razorpay_payment_id}</td></tr>
+      <tr><td class="label">Date:</td><td>\${new Date(order.created_at).toLocaleString()}</td></tr>
+      <tr><td class="label">Customer:</td><td>\${order.customer_name}</td></tr>
+      <tr><td class="label">Email:</td><td>\${order.email}</td></tr>
+      <tr><td class="label">Phone:</td><td>\${order.phone}</td></tr>
+      <tr><td class="label">Address:</td><td>\${parsedAddress}</td></tr>
+    </table>
+    <table class="items-table">
+      <thead>
+        <tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr>
+      </thead>
+      <tbody>
+        \${itemsListHTML}
+        <tr class="total-row">
+          <td colspan="3" style="text-align: right; padding-top: 15px;">Grand Total:</td>
+          <td style="padding-top: 15px;">₹\${order.total_amount}</td>
+        </tr>
+      </tbody>
+    </table>
+    <div class="footer">
+      <p>Thank you for choosing AARINIYA.</p>
+    </div>
+  </div>
+</body>
+</html>\`;
+
+  const textContent = \`==================================================
+                   AARINIYA                       
+           Nature's Sweetest Ritual               
+==================================================
+
+ORDER RECEIPT
+--------------------------------------------------
+Order ID:      \${order.razorpay_order_id}
+Payment ID:    \${order.razorpay_payment_id}
+Date:          \${new Date(order.created_at).toLocaleString()}
+Customer Name: \${order.customer_name}
+Email:         \${order.email}
+Phone:         \${order.phone}
+Shipping:      \${parsedAddress}
+--------------------------------------------------
+
+ITEMS PURCHASED:
+--------------------------------------------------
+\${itemsListText}
+--------------------------------------------------
+Grand Total:   ₹\${order.total_amount}
+--------------------------------------------------
+
+Thank you for choosing AARINIYA.
+==================================================\`;
+
+  const htmlPath = path.join(receiptsDir, \`receipt_\${order.razorpay_order_id}.html\`);
+  const txtPath = path.join(receiptsDir, \`receipt_\${order.razorpay_order_id}.txt\`);
+
+  fs.writeFileSync(htmlPath, htmlContent, 'utf8');
+  fs.writeFileSync(txtPath, textContent, 'utf8');
+  console.log(\`Receipts saved to filesystem for order \${order.razorpay_order_id}\`);
+}
+
 // Get user's order history
 app.get('/api/orders/my-orders', authenticateToken, (req, res) => {
```
