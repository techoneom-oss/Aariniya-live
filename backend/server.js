import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import db from './database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import http from 'http';
import { URL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'aariniya_secret_key_987654321';

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_mockKeyId123';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'mockKeySecret123456789';

// Setup Razorpay instance
// In standard test mode, you can use these fallback test credentials if environment variables aren't provided.
const razorpay = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET
});

app.use(cors());
app.use(express.json());

// Root redirect to frontend
app.get('/', (req, res) => {
  res.send('<html><body style="font-family:sans-serif;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;background:#fbf9f4;"><div style="text-align:center"><h2 style="color:#1c352d">Aariniya API Server</h2><p style="color:#6b7771">This is the backend. <a href="http://localhost:3001" style="color:#c49a3c;font-weight:bold">Click here to open the website →</a></p></div></body></html>');
});

// --- JWT Middleware ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: 'Access token required' });
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
};

const authenticateTokenOptional = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token || token === 'undefined' || token === 'null' || token === 'Bearer') {
    req.user = null;
    return next();
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      // If token is invalid or expired, just treat as guest instead of blocking
      req.user = null;
      return next();
    }
    req.user = user;
    next();
  });
};

// --- Webhook / Google Sheets Helper ---
const sendPayloadToWebhook = (urlStr, payload) => {
  return new Promise((resolve, reject) => {
    try {
      const parsedUrl = new URL(urlStr);
      const postData = JSON.stringify(payload);
      const client = parsedUrl.protocol === 'https:' ? https : http;

      const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
        path: parsedUrl.pathname + parsedUrl.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const req = client.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => { resolve(data); });
      });

      req.on('error', (e) => { reject(e); });
      req.write(postData);
      req.end();
    } catch (err) {
      reject(err);
    }
  });
};

const sendOrderToGoogleSheet = async (order) => {
  const webhookUrl = process.env.GOOGLE_SHEET_WEBHOOK_URL;
  if (!webhookUrl) {
    console.log("Google Sheet Webhook URL not configured. Skipping sheet logging.");
    return;
  }
  
  try {
    let itemsParsed = [];
    try {
      itemsParsed = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
    } catch(e) {
      itemsParsed = order.items || [];
    }

    let addressParsed = {};
    try {
      addressParsed = typeof order.address === 'string' ? JSON.parse(order.address) : order.address;
    } catch(e) {
      addressParsed = order.address || {};
    }

    const itemsSummary = itemsParsed.map(item => {
      const qty = item.qty || item.quantity || 1;
      return `${item.name} (${qty})`;
    }).join(', ');

    const addressStr = `${addressParsed.address_line1 || ''}, ${addressParsed.address_line2 || ''}, ${addressParsed.city || ''}, ${addressParsed.state || ''} - ${addressParsed.postal_code || ''}`;

    const payload = {
      order_id: order.razorpay_order_id || `order_${order.id}`,
      payment_id: order.razorpay_payment_id || 'N/A',
      customer_name: order.customer_name,
      email: order.email,
      phone: order.phone,
      address: addressStr,
      items: itemsSummary,
      total_amount: order.total_amount,
      status: order.payment_status,
      date: order.created_at || new Date().toISOString()
    };

    console.log("Sending order details to Google Sheets...", payload);
    await sendPayloadToWebhook(webhookUrl, payload);
    console.log("Successfully sent order to Google Sheets Webhook.");
  } catch (error) {
    console.error("Error sending order to Google Sheets:", error.message);
  }
};

const isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin role required.' });
  }
  next();
};

// --- AUTH ROUTES ---

// Signup
app.post('/api/auth/signup', (req, res) => {
  const { email, password, full_name, phone } = req.body;
  if (!email || !password || !full_name) {
    return res.status(400).json({ error: 'Email, password and name are required' });
  }

  // Hash password
  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(password, salt);

  const query = `
    INSERT INTO users (email, password_hash, full_name, phone) 
    VALUES (?, ?, ?, ?)
  `;

  db.run(query, [email, passwordHash, full_name, phone || ''], function(err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ error: 'Email is already registered' });
      }
      return res.status(500).json({ error: err.message });
    }
    
    // Generate token
    const token = jwt.sign({ id: this.lastID, email, role: 'user' }, JWT_SECRET, { expiresIn: '24h' });
    
    res.status(201).json({
      message: 'Signup successful',
      token,
      user: { id: this.lastID, email, full_name, phone: phone || '', role: 'user' }
    });
  });
});

// Login
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

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        phone: user.phone,
        role: user.role,
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

// --- USER PROFILE ROUTES ---

// Get Profile
app.get('/api/user/profile', authenticateToken, (req, res) => {
  db.get('SELECT id, email, full_name, phone, address_line1, address_line2, city, state, postal_code, country, role FROM users WHERE id = ?', [req.user.id], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  });
});

// Update Profile (Address and Contact)
app.put('/api/user/profile', authenticateToken, (req, res) => {
  const { full_name, phone, address_line1, address_line2, city, state, postal_code, country } = req.body;

  const query = `
    UPDATE users 
    SET full_name = ?, phone = ?, address_line1 = ?, address_line2 = ?, city = ?, state = ?, postal_code = ?, country = ?
    WHERE id = ?
  `;

  db.run(query, [
    full_name, phone, address_line1, address_line2, city, state, postal_code, country, req.user.id
  ], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Profile updated successfully' });
  });
});

// --- PRODUCTS & REVIEWS ROUTES ---

// Get all products
app.get('/api/products', (req, res) => {
  db.all('SELECT * FROM products', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    
    // Parse JSON strings
    const products = rows.map(p => ({
      ...p,
      highlights: JSON.parse(p.highlights || '[]'),
      taste_profile: JSON.parse(p.taste_profile || '{}'),
      ways_to_enjoy: JSON.parse(p.ways_to_enjoy || '[]'),
      details: JSON.parse(p.details || '{}'),
      who_is_it_for: JSON.parse(p.who_is_it_for || '[]'),
      images: JSON.parse(p.images || '[]')
    }));
    
    res.json(products);
  });
});

// Get a single product details
app.get('/api/products/:id', (req, res) => {
  db.get('SELECT * FROM products WHERE id = ?', [req.params.id], (err, p) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!p) return res.status(404).json({ error: 'Product not found' });

    const product = {
      ...p,
      highlights: JSON.parse(p.highlights || '[]'),
      taste_profile: JSON.parse(p.taste_profile || '{}'),
      ways_to_enjoy: JSON.parse(p.ways_to_enjoy || '[]'),
      details: JSON.parse(p.details || '{}'),
      who_is_it_for: JSON.parse(p.who_is_it_for || '[]'),
      images: JSON.parse(p.images || '[]')
    };
    
    res.json(product);
  });
});

// Get reviews for a product
app.get('/api/reviews/:productId', (req, res) => {
  db.all('SELECT * FROM reviews WHERE product_id = ? ORDER BY date DESC', [req.params.productId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    const reviews = rows.map(r => ({
      ...r,
      tags: JSON.parse(r.tags || '[]')
    }));
    res.json(reviews);
  });
});

// Post review
app.post('/api/reviews', (req, res) => {
  const { product_id, reviewer_name, title, rating, review_text, tags } = req.body;
  if (!product_id || !reviewer_name || !rating || !review_text) {
    return res.status(400).json({ error: 'All review fields are required' });
  }

  const query = `
    INSERT INTO reviews (product_id, reviewer_name, title, rating, review_text, tags, helpful_count)
    VALUES (?, ?, ?, ?, ?, ?, 0)
  `;

  db.run(query, [product_id, reviewer_name, title || '', rating, review_text, JSON.stringify(tags || [])], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({
      id: this.lastID,
      product_id,
      reviewer_name,
      title: title || '',
      rating,
      review_text,
      tags: tags || [],
      date: new Date().toISOString(),
      helpful_count: 0
    });
  });
});

// --- COURSES ROUTES ---
app.get('/api/courses', (req, res) => {
  db.all('SELECT * FROM courses', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// --- RAZORPAY & ORDER FLOW ROUTES ---

// Helper database retrieval functions
const getProductById = (id) => {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM products WHERE id = ?', [id], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const getCourseById = (id) => {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM courses WHERE id = ?', [id], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

// Create Order (Initiate Checkout)
app.post('/api/orders/create', authenticateTokenOptional, async (req, res) => {
  const { amount, currency, customer_name, email, phone, address, items } = req.body;
  if (amount === undefined || !customer_name || !email || !phone || !address || !items) {
    return res.status(400).json({ error: 'Missing required checkout information' });
  }

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Invalid order amount' });
  }

  try {
    let calculatedTotal = 0;
    for (const item of items) {
      const qty = item.qty !== undefined ? item.qty : item.quantity;
      if (qty === undefined || !Number.isInteger(qty) || qty < 1) {
        return res.status(400).json({ error: 'Invalid order amount' });
      }

      if (item.isCourse) {
        let courseId = item.id;
        if (typeof item.id === 'string' && item.id.startsWith('course_')) {
          courseId = parseInt(item.id.replace('course_', ''), 10);
        }
        const course = await getCourseById(courseId);
        if (!course) {
          return res.status(400).json({ error: 'Invalid order amount' });
        }
        calculatedTotal += course.price;
      } else {
        // Parse database product ID and packSize from item.id
        let productId = item.id;
        let packSize = item.packSize || 1;
        if (typeof item.id === 'string' && item.id.includes('_pack_')) {
          const parts = item.id.split('_pack_');
          productId = parseInt(parts[0], 10);
          packSize = parseInt(parts[1], 10);
        }

        const product = await getProductById(productId);
        if (!product) {
          return res.status(400).json({ error: 'Invalid order amount' });
        }

        // Determine pack price
        let itemPrice = product.price; // fallback
        if (productId === 1) {
          if (packSize === 1) {
            itemPrice = 1970;
          } else if (packSize === 2) {
            itemPrice = 3690;
          } else if (packSize === 5) {
            itemPrice = 8450;
          }
        }

        const inventoryRequired = qty * packSize;
        if (!item.isPreorder && product.inventory < inventoryRequired) {
          return res.status(400).json({ error: `Insufficient stock for product ${product.name}` });
        }
        calculatedTotal += itemPrice * qty;
      }
    }

    if (amount !== calculatedTotal) {
      return res.status(400).json({ error: 'Invalid order amount' });
    }
  } catch (error) {
    console.error("Order verification error:", error);
    return res.status(400).json({ error: 'Invalid order amount' });
  }

  // Create Razorpay Order
  const options = {
    amount: Math.round(amount * 100), // Amount in paise
    currency: currency || 'INR',
    receipt: `receipt_order_${Date.now()}`
  };

  // Check if Razorpay keys are default mock values. 
  // If keys are mock, we create a mock order_id to bypass Razorpay connection errors for testing.
  if (RAZORPAY_KEY_ID === 'rzp_test_mockKeyId123') {
    const mockOrderId = `order_mock_${crypto.randomBytes(8).toString('hex')}`;
    
    // Save order in database with pending status
    const query = `
      INSERT INTO orders (razorpay_order_id, user_id, customer_name, email, phone, address, items, total_amount, payment_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `;

    db.run(query, [
      mockOrderId, req.user ? req.user.id : null, customer_name, email, phone, JSON.stringify(address), JSON.stringify(items), amount
    ], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      return res.json({
        id: mockOrderId,
        amount: options.amount,
        currency: options.currency,
        isMock: true
      });
    });
  } else {
    // Real Razorpay setup
    razorpay.orders.create(options, (err, razorpayOrder) => {
      if (err) {
        console.error("Razorpay order creation error:", err);
        return res.status(500).json({ error: err.message });
      }

      // Save order in database with pending status
      const query = `
        INSERT INTO orders (razorpay_order_id, user_id, customer_name, email, phone, address, items, total_amount, payment_status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
      `;

      db.run(query, [
        razorpayOrder.id, req.user ? req.user.id : null, customer_name, email, phone, JSON.stringify(address), JSON.stringify(items), amount
      ], function(dbErr) {
        if (dbErr) return res.status(500).json({ error: dbErr.message });
        res.json({
          id: razorpayOrder.id,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          key: RAZORPAY_KEY_ID,
          isMock: false
        });
      });
    });
  }
});

// Verify Payment Signature
app.post('/api/orders/verify', (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, isMock } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id) {
    return res.status(400).json({ error: 'Missing payment signature details' });
  }

  // First, check if the order exists in the database
  db.get('SELECT * FROM orders WHERE razorpay_order_id = ?', [razorpay_order_id], (orderErr, order) => {
    if (orderErr) return res.status(500).json({ error: orderErr.message });
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.payment_status === 'paid') {
      return res.status(400).json({ error: 'Order has already been processed and paid' });
    }

    // Handle Mock verification
    if (process.env.NODE_ENV !== 'production' && (isMock || razorpay_order_id.startsWith('order_mock_'))) {
      const query = `
        UPDATE orders 
        SET razorpay_payment_id = ?, payment_status = 'paid'
        WHERE razorpay_order_id = ?
      `;

      db.run(query, [razorpay_payment_id, razorpay_order_id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        
        db.get('SELECT * FROM orders WHERE razorpay_order_id = ?', [razorpay_order_id], (getErr, updatedOrder) => {
          if (getErr) return res.status(500).json({ error: getErr.message });
          
          processReceiptAndInventory(updatedOrder, () => {
            return res.json({
              status: 'success',
              message: 'Payment verified successfully (Mock Mode)',
              order: updatedOrder
            });
          });
        });
      });
    } else {
      // Real Razorpay signature verification
      const text = razorpay_order_id + "|" + razorpay_payment_id;
      const generated_signature = crypto
        .createHmac("sha256", RAZORPAY_KEY_SECRET)
        .update(text)
        .digest("hex");

      if (generated_signature === razorpay_signature) {
        const query = `
          UPDATE orders 
          SET razorpay_payment_id = ?, payment_status = 'paid'
          WHERE razorpay_order_id = ?
        `;

        db.run(query, [razorpay_payment_id, razorpay_order_id], function(err) {
          if (err) return res.status(500).json({ error: err.message });
          
          db.get('SELECT * FROM orders WHERE razorpay_order_id = ?', [razorpay_order_id], (getErr, updatedOrder) => {
            if (getErr) return res.status(500).json({ error: getErr.message });
            
            processReceiptAndInventory(updatedOrder, () => {
              res.json({
                status: 'success',
                message: 'Payment verified successfully',
                order: updatedOrder
              });
            });
          });
        });
      } else {
        const query = `
          UPDATE orders 
          SET payment_status = 'failed'
          WHERE razorpay_order_id = ?
        `;
        db.run(query, [razorpay_order_id], (err) => {
          res.status(400).json({ error: 'Invalid signature. Payment verification failed.' });
        });
      }
    }
  });
});

// Get user's order history
app.get('/api/orders/my-orders', authenticateToken, (req, res) => {
  db.all('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC', [req.user.id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    
    const orders = rows.map(o => ({
      ...o,
      address: JSON.parse(o.address || '{}'),
      items: JSON.parse(o.items || '[]')
    }));
    
    res.json(orders);
  });
});

// --- ADMIN & MANAGEMENT ROUTES ---

app.get('/api/admin/dashboard-stats', authenticateToken, isAdmin, (req, res) => {
  db.all("SELECT * FROM orders WHERE payment_status = 'paid' ORDER BY created_at DESC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });

    let totalRevenue = 0;
    const activeOrders = rows.map(o => {
      totalRevenue += o.total_amount;
      return {
        ...o,
        address: JSON.parse(o.address || '{}'),
        items: JSON.parse(o.items || '[]')
      };
    });

    res.json({
      revenue: totalRevenue,
      orderCount: activeOrders.length,
      activeOrders
    });
  });
});

app.put('/api/admin/products/:id/inventory', authenticateToken, isAdmin, (req, res) => {
  const { inventory } = req.body;
  const productId = req.params.id;

  if (inventory === undefined || !Number.isInteger(inventory) || inventory < 0) {
    return res.status(400).json({ error: 'Inventory value is required and must be a non-negative integer' });
  }

  db.run("UPDATE products SET inventory = ? WHERE id = ?", [inventory, productId], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Product not found' });

    db.get("SELECT * FROM products WHERE id = ?", [productId], (getErr, p) => {
      if (getErr) return res.status(500).json({ error: getErr.message });
      if (!p) return res.status(404).json({ error: 'Product not found' });

      const product = {
        ...p,
        highlights: JSON.parse(p.highlights || '[]'),
        taste_profile: JSON.parse(p.taste_profile || '{}'),
        ways_to_enjoy: JSON.parse(p.ways_to_enjoy || '[]'),
        details: JSON.parse(p.details || '{}'),
        who_is_it_for: JSON.parse(p.who_is_it_for || '[]'),
        images: JSON.parse(p.images || '[]')
      };
      res.json({ message: 'Inventory updated successfully', product });
    });
  });
});

app.put('/api/admin/courses/:id/enrollment', authenticateToken, isAdmin, (req, res) => {
  const { enrollment_status } = req.body;
  const courseId = req.params.id;

  if (!enrollment_status || !['open', 'closed'].includes(enrollment_status)) {
    return res.status(400).json({ error: "Enrollment status must be either 'open' or 'closed'" });
  }

  db.run("UPDATE courses SET enrollment_status = ? WHERE id = ?", [enrollment_status, courseId], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Course not found' });

    db.get("SELECT * FROM courses WHERE id = ?", [courseId], (getErr, course) => {
      if (getErr) return res.status(500).json({ error: getErr.message });
      res.json({ message: 'Enrollment status updated successfully', course });
    });
  });
});

function escapeHtml(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function processReceiptAndInventory(order, callback) {
  let items = [];
  let address = {};
  try {
    const parsedItems = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
    if (Array.isArray(parsedItems)) {
      items = parsedItems;
    } else {
      items = [];
    }
  } catch (e) {
    console.error("Error parsing items JSON for receipt:", e);
    items = [];
  }
  try {
    address = typeof order.address === 'string' ? JSON.parse(order.address) : (order.address || {});
  } catch (e) {
    console.error("Error parsing address JSON for receipt:", e);
    address = {};
  }

  const physicalItems = items.filter(item => item && item.isCourse !== true);
  let completedUpdates = 0;

  function proceedToReceipt() {
    try {
      const receiptsDir = path.resolve(__dirname, 'logs', 'receipts');
      fs.mkdirSync(receiptsDir, { recursive: true });

      const orderId = order.razorpay_order_id || `order_${order.id}`;
      const txtPath = path.join(receiptsDir, `receipt_${orderId}.txt`);
      const htmlPath = path.join(receiptsDir, `receipt_${orderId}.html`);

      const itemsListTxt = items.map(item => {
        const qty = item.qty || item.quantity || 1;
        const price = item.price || 0;
        let typeStr = item.isCourse ? '[Course]' : '[Physical]';
        if (item.isPreorder) {
          typeStr += ' (Pre-order)';
        }
        return `- ${item.name} ${typeStr} x${qty} @ INR ${price.toFixed(2)} = INR ${(qty * price).toFixed(2)}`;
      }).join('\n');

      const itemsListHtml = items.map(item => {
        const qty = item.qty || item.quantity || 1;
        const price = item.price || 0;
        let typeStr = item.isCourse ? 'Course' : 'Physical';
        if (item.isPreorder) {
          typeStr += ' (Pre-order)';
        }
        const escapedItemName = escapeHtml(item.name);
        return `
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px;">${escapedItemName}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${typeStr}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${qty}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">INR ${price.toFixed(2)}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">INR ${(qty * price).toFixed(2)}</td>
          </tr>
        `;
      }).join('');

      const addressStr = `${address.address_line1 || ''}, ${address.address_line2 || ''}, ${address.city || ''}, ${address.state || ''} - ${address.postal_code || ''}, ${address.country || ''}`;

      const txtContent = `==================================================
                 AARINIYA RECEIPT
==================================================
Order ID:        ${orderId}
Payment ID:      ${order.razorpay_payment_id || 'N/A'}
Date:            ${order.created_at || new Date().toISOString()}
Payment Status:  PAID
--------------------------------------------------
Customer Details:
Name:            ${order.customer_name}
Email:           ${order.email}
Phone:           ${order.phone}
Address:         ${addressStr}
--------------------------------------------------
Purchased Items:
${itemsListTxt}
--------------------------------------------------
Total Amount:    INR ${Number(order.total_amount).toFixed(2)}
==================================================
          Thank you for choosing Aariniya!
==================================================`;

      const escapedOrderId = escapeHtml(orderId);
      const escapedPaymentId = escapeHtml(order.razorpay_payment_id || 'N/A');
      const escapedCustomerName = escapeHtml(order.customer_name);
      const escapedEmail = escapeHtml(order.email);
      const escapedPhone = escapeHtml(order.phone);
      const escapedAddressStr = escapeHtml(addressStr);
      const escapedDate = escapeHtml(order.created_at || new Date().toISOString());

      const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Aariniya - Order Receipt</title>
  <style>
    body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; padding: 20px; }
    .receipt-container { max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.05); }
    h1 { color: #2e5a44; text-align: center; margin-bottom: 20px; }
    .details-table, .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    .details-table td { padding: 6px 0; }
    .details-table td.label { font-weight: bold; width: 120px; }
    .items-table th { background-color: #f8f8f8; font-weight: bold; border: 1px solid #ddd; padding: 8px; text-align: left; }
    .total-section { text-align: right; font-size: 1.2em; font-weight: bold; margin-top: 20px; color: #2e5a44; }
    .footer { text-align: center; margin-top: 30px; font-size: 0.9em; color: #777; }
  </style>
</head>
<body>
  <div class="receipt-container">
    <h1>Aariniya Wellness</h1>
    <hr style="border: 0; border-top: 1px solid #eee; margin-bottom: 20px;">
    
    <table class="details-table">
      <tr><td class="label">Order ID:</td><td>${escapedOrderId}</td></tr>
      <tr><td class="label">Payment ID:</td><td>${escapedPaymentId}</td></tr>
      <tr><td class="label">Date:</td><td>${escapedDate}</td></tr>
      <tr><td class="label">Status:</td><td><span style="color: green; font-weight: bold;">PAID</span></td></tr>
    </table>
    
    <h3 style="color: #2e5a44; border-bottom: 1px solid #eee; padding-bottom: 5px;">Customer Info</h3>
    <table class="details-table">
      <tr><td class="label">Name:</td><td>${escapedCustomerName}</td></tr>
      <tr><td class="label">Email:</td><td>${escapedEmail}</td></tr>
      <tr><td class="label">Phone:</td><td>${escapedPhone}</td></tr>
      <tr><td class="label">Address:</td><td>${escapedAddressStr}</td></tr>
    </table>
    
    <h3 style="color: #2e5a44; border-bottom: 1px solid #eee; padding-bottom: 5px;">Items</h3>
    <table class="items-table">
      <thead>
        <tr>
          <th>Item</th>
          <th>Type</th>
          <th style="text-align: center;">Qty</th>
          <th style="text-align: right;">Unit Price</th>
          <th style="text-align: right;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemsListHtml}
      </tbody>
    </table>
    
    <div class="total-section">
      Total Paid: INR ${Number(order.total_amount).toFixed(2)}
    </div>
    
    <div class="footer">
      Thank you for shopping with us! <br>
      For queries, support, or feedback, email us at techoneom@gmail.com
    </div>
  </div>
</body>
</html>`;

      fs.writeFileSync(txtPath, txtContent, 'utf8');
      fs.writeFileSync(htmlPath, htmlContent, 'utf8');
      console.log(`Receipts written successfully for ${orderId}`);
      
      // Async log to Google Sheets if webhook configured
      sendOrderToGoogleSheet(order).catch(err => {
        console.error("Error logging to Google Sheets asynchronously:", err);
      });
    } catch (writeErr) {
      console.error("Error writing receipt files:", writeErr);
    }

    if (callback) callback();
  }

  if (physicalItems.length === 0) {
    proceedToReceipt();
  } else {
    physicalItems.forEach(item => {
      let itemId = item.id || item.product_id || item.productId;
      const qty = item.qty || item.quantity || 1;
      
      let productId = itemId;
      let packSize = item.packSize || 1;
      if (typeof itemId === 'string' && itemId.includes('_pack_')) {
        const parts = itemId.split('_pack_');
        productId = parseInt(parts[0], 10);
        packSize = parseInt(parts[1], 10);
      }

      const totalQty = qty * packSize;

      const decrementQuery = `
        UPDATE products 
        SET inventory = CASE WHEN inventory - ? < 0 THEN 0 ELSE inventory - ? END 
        WHERE id = ?
      `;
      db.run(decrementQuery, [totalQty, totalQty, productId], function(err) {
        if (err) {
          console.error(`Error decrementing inventory for product ${productId}:`, err);
        } else {
          console.log(`Decremented inventory for product ${productId} by ${totalQty}. Rows updated: ${this.changes}`);
        }

        completedUpdates++;
        if (completedUpdates === physicalItems.length) {
          proceedToReceipt();
        }
      });
    });
  }
}

app.listen(PORT, () => {
  console.log(`Aariniya backend running on port ${PORT}`);
});
