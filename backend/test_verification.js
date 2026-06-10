import db from './database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTests() {
  console.log("=== STARTING BACKEND VERIFICATION TESTS ===");

  // Wait for database initialization
  console.log("Waiting for database connection and initialization...");
  await wait(2000);

  // 1. Verify Database Schema and Seeding
  await new Promise((resolve, reject) => {
    db.all("PRAGMA table_info(users)", (err, rows) => {
      if (err) return reject(err);
      const hasRole = rows.some(r => r.name === 'role');
      console.log(`- Users table has 'role' column: ${hasRole}`);
      if (!hasRole) reject(new Error("role column missing in users"));
      resolve();
    });
  });

  await new Promise((resolve, reject) => {
    db.all("PRAGMA table_info(courses)", (err, rows) => {
      if (err) return reject(err);
      const hasStatus = rows.some(r => r.name === 'enrollment_status');
      console.log(`- Courses table has 'enrollment_status' column: ${hasStatus}`);
      if (!hasStatus) reject(new Error("enrollment_status column missing in courses"));
      resolve();
    });
  });

  await new Promise((resolve, reject) => {
    db.get("SELECT role FROM users WHERE email = 'admin@aariniya.com'", (err, row) => {
      if (err) return reject(err);
      console.log(`- Admin seed verification: role is ${row ? row.role : 'NULL'}`);
      if (!row || row.role !== 'admin') reject(new Error("admin user not seeded correctly"));
      resolve();
    });
  });

  await new Promise((resolve, reject) => {
    db.get("SELECT role FROM users WHERE email = 'user@aariniya.com'", (err, row) => {
      if (err) return reject(err);
      console.log(`- User seed verification: role is ${row ? row.role : 'NULL'}`);
      if (!row || row.role !== 'user') reject(new Error("user user not seeded correctly"));
      resolve();
    });
  });

  // 2. HTTP Endpoints test
  const baseUrl = 'http://localhost:5000';
  
  // Login as admin
  console.log("Logging in as admin...");
  const adminLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@aariniya.com', password: 'admin123' })
  });
  const adminLoginData = await adminLoginRes.json();
  console.log(`- Admin login response keys: ${Object.keys(adminLoginData)}`);
  console.log(`- Admin login user role: ${adminLoginData.user ? adminLoginData.user.role : 'undefined'}`);
  const adminToken = adminLoginData.token;
  if (!adminToken || adminLoginData.user.role !== 'admin') {
    throw new Error("Admin login failed or role missing");
  }

  // Login as regular user
  console.log("Logging in as regular user...");
  const userLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'user@aariniya.com', password: 'user123' })
  });
  const userLoginData = await userLoginRes.json();
  console.log(`- User login response keys: ${Object.keys(userLoginData)}`);
  console.log(`- User login user role: ${userLoginData.user ? userLoginData.user.role : 'undefined'}`);
  const userToken = userLoginData.token;
  if (!userToken || userLoginData.user.role !== 'user') {
    throw new Error("User login failed or role missing");
  }

  // Get User Profile (Admin)
  console.log("Fetching admin profile...");
  const adminProfileRes = await fetch(`${baseUrl}/api/user/profile`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const adminProfileData = await adminProfileRes.json();
  console.log(`- Profile role field: ${adminProfileData.role}`);
  if (adminProfileData.role !== 'admin') {
    throw new Error("Profile endpoint missing or incorrect role field");
  }

  // Admin stats endpoint (authorized)
  console.log("Fetching admin dashboard stats (Authorized)...");
  const statsRes = await fetch(`${baseUrl}/api/admin/dashboard-stats`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const statsData = await statsRes.json();
  console.log(`- Dashboard stats status: ${statsRes.status}`);
  console.log(`- Dashboard stats revenue: ${statsData.revenue}, count: ${statsData.orderCount}`);
  if (statsRes.status !== 200 || statsData.revenue === undefined) {
    throw new Error("Admin stats endpoint failed");
  }

  // Admin stats endpoint (unauthorized)
  console.log("Fetching admin dashboard stats (Unauthorized)...");
  const statsUnauthRes = await fetch(`${baseUrl}/api/admin/dashboard-stats`, {
    headers: { 'Authorization': `Bearer ${userToken}` }
  });
  console.log(`- Dashboard stats unauth response status: ${statsUnauthRes.status}`);
  if (statsUnauthRes.status !== 403) {
    throw new Error("Admin stats endpoint authorization check failed (should return 403)");
  }

  // Update product inventory (Authorized)
  console.log("Updating product inventory (Authorized)...");
  const prodInvRes = await fetch(`${baseUrl}/api/admin/products/1/inventory`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}` 
    },
    body: JSON.stringify({ inventory: 85 })
  });
  const prodInvData = await prodInvRes.json();
  console.log(`- Updated product inventory response status: ${prodInvRes.status}`);
  console.log(`- Updated inventory value in response: ${prodInvData.product ? prodInvData.product.inventory : 'undefined'}`);
  if (prodInvRes.status !== 200 || !prodInvData.product || prodInvData.product.inventory !== 85) {
    throw new Error("Product inventory update failed");
  }

  // Update product inventory (Unauthorized)
  console.log("Updating product inventory (Unauthorized)...");
  const prodInvUnauthRes = await fetch(`${baseUrl}/api/admin/products/1/inventory`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userToken}` 
    },
    body: JSON.stringify({ inventory: 100 })
  });
  console.log(`- Updated inventory unauth status: ${prodInvUnauthRes.status}`);
  if (prodInvUnauthRes.status !== 403) {
    throw new Error("Product inventory update authorization check failed (should return 403)");
  }

  // Update course status (Authorized)
  console.log("Updating course status (Authorized)...");
  const courseStatusRes = await fetch(`${baseUrl}/api/admin/courses/1/enrollment`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}` 
    },
    body: JSON.stringify({ enrollment_status: 'closed' })
  });
  const courseStatusData = await courseStatusRes.json();
  console.log(`- Updated course status response status: ${courseStatusRes.status}`);
  console.log(`- Updated enrollment_status in response: ${courseStatusData.course ? courseStatusData.course.enrollment_status : 'undefined'}`);
  if (courseStatusRes.status !== 200 || !courseStatusData.course || courseStatusData.course.enrollment_status !== 'closed') {
    throw new Error("Course enrollment status update failed");
  }

  // Update course status (invalid body)
  console.log("Updating course status with invalid body...");
  const courseStatusInvalidRes = await fetch(`${baseUrl}/api/admin/courses/1/enrollment`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}` 
    },
    body: JSON.stringify({ enrollment_status: 'invalid_status_value' })
  });
  console.log(`- Course status invalid body response status: ${courseStatusInvalidRes.status}`);
  if (courseStatusInvalidRes.status !== 400) {
    throw new Error("Course enrollment status update should reject invalid values with 400");
  }

  // Create Order (Mock Checkout)
  console.log("Creating checkout order...");
  const testItems = [
    { id: 1, name: "AARINIYA Deep Forest Multifloral Honey", price: 1199, qty: 2, isCourse: false },
    { id: 1, name: "Forest Morning Yoga Flow", price: 1999, qty: 1, isCourse: true }
  ];
  const testAddress = {
    address_line1: "123 Green Lane",
    address_line2: "Near Woods",
    city: "Bangalore",
    state: "Karnataka",
    postal_code: "560001",
    country: "India"
  };

  const createOrderRes = await fetch(`${baseUrl}/api/orders/create`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userToken}` 
    },
    body: JSON.stringify({
      amount: 4397,
      currency: "INR",
      customer_name: "Regular User",
      email: "user@aariniya.com",
      phone: "9876543210",
      address: testAddress,
      items: testItems,
      user_id: 2
    })
  });
  const createOrderData = await createOrderRes.json();
  const mockOrderId = createOrderData.id;
  console.log(`- Created order response ID: ${mockOrderId}, amount: ${createOrderData.amount}`);
  if (!mockOrderId) {
    throw new Error("Order creation failed");
  }

  // Get initial inventory of product 1
  const initialProdRes = await fetch(`${baseUrl}/api/products/1`);
  const initialProdData = await initialProdRes.json();
  const initialInventory = initialProdData.inventory;
  console.log(`- Product 1 inventory before payment: ${initialInventory}`);

  // Verify Payment Signature (Mock Checkout)
  console.log("Verifying payment...");
  const mockPaymentId = `pay_mock_${Date.now()}`;
  const verifyRes = await fetch(`${baseUrl}/api/orders/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      razorpay_order_id: mockOrderId,
      razorpay_payment_id: mockPaymentId,
      isMock: true
    })
  });
  const verifyData = await verifyRes.json();
  console.log(`- Payment verify status: ${verifyData.status}`);
  if (verifyRes.status !== 200 || verifyData.status !== 'success') {
    throw new Error("Payment verification failed");
  }

  // Verify inventory decrement
  await wait(500); // Wait for async database execution
  const afterProdRes = await fetch(`${baseUrl}/api/products/1`);
  const afterProdData = await afterProdRes.json();
  const finalInventory = afterProdData.inventory;
  console.log(`- Product 1 inventory after payment: ${finalInventory}`);
  // We bought 2 items of Product 1, so final inventory should be initial - 2
  if (finalInventory !== initialInventory - 2) {
    throw new Error(`Inventory decrement failed. Expected ${initialInventory - 2}, got ${finalInventory}`);
  }

  // Verify Receipt Files existence and contents
  const receiptsDir = path.resolve(__dirname, 'logs', 'receipts');
  const txtPath = path.join(receiptsDir, `receipt_${mockOrderId}.txt`);
  const htmlPath = path.join(receiptsDir, `receipt_${mockOrderId}.html`);

  const hasTxt = fs.existsSync(txtPath);
  const hasHtml = fs.existsSync(htmlPath);
  console.log(`- Receipt TXT exists: ${hasTxt}`);
  console.log(`- Receipt HTML exists: ${hasHtml}`);

  if (!hasTxt || !hasHtml) {
    throw new Error("Receipt files were not generated");
  }

  const txtContent = fs.readFileSync(txtPath, 'utf8');
  const htmlContent = fs.readFileSync(htmlPath, 'utf8');

  console.log(`- TXT receipt contains order ID: ${txtContent.includes(mockOrderId)}`);
  console.log(`- TXT receipt contains payment ID: ${txtContent.includes(mockPaymentId)}`);
  console.log(`- HTML receipt contains order ID: ${htmlContent.includes(mockOrderId)}`);

  if (!txtContent.includes(mockOrderId) || !htmlContent.includes(mockOrderId)) {
    throw new Error("Receipt content is missing order ID details");
  }

  // Check admin dashboard stats totals
  console.log("Checking dashboard stats again to verify totals...");
  const statsVerifyRes = await fetch(`${baseUrl}/api/admin/dashboard-stats`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const statsVerifyData = await statsVerifyRes.json();
  console.log(`- Updated revenue: ${statsVerifyData.revenue}`);
  console.log(`- Updated order count: ${statsVerifyData.orderCount}`);

  // --- NEW SECURITY & INTEGRITY VERIFICATION CHECKS ---
  console.log("=== STARTING NEW SECURITY & INTEGRITY CHECKS ===");

  // 1. Price Manipulation Check (should return 400 Bad Request)
  console.log("Testing Price Manipulation Protection (amount mismatch)...");
  const badPriceRes = await fetch(`${baseUrl}/api/orders/create`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userToken}`
    },
    body: JSON.stringify({
      amount: 1, // Maliciously low price
      currency: "INR",
      customer_name: "Regular User",
      email: "user@aariniya.com",
      phone: "9876543210",
      address: testAddress,
      items: testItems
    })
  });
  console.log(`- Price Manipulation response status: ${badPriceRes.status}`);
  const badPriceData = await badPriceRes.json();
  console.log(`- Price Manipulation response: ${JSON.stringify(badPriceData)}`);
  if (badPriceRes.status !== 400 || badPriceData.error !== 'Invalid order amount') {
    throw new Error("Price manipulation security check failed!");
  }

  // 2. Negative/Decimal Quantity Check (should return 400 Bad Request)
  console.log("Testing Negative/Decimal Quantity Protection...");
  const badQtyRes = await fetch(`${baseUrl}/api/orders/create`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userToken}`
    },
    body: JSON.stringify({
      amount: 4397,
      currency: "INR",
      customer_name: "Regular User",
      email: "user@aariniya.com",
      phone: "9876543210",
      address: testAddress,
      items: [
        { id: 1, name: "AARINIYA Deep Forest Multifloral Honey", price: 1199, qty: -2, isCourse: false },
        { id: 2, name: "Forest Morning Yoga Flow", price: 1999, qty: 1, isCourse: true }
      ]
    })
  });
  console.log(`- Negative Quantity response status: ${badQtyRes.status}`);
  if (badQtyRes.status !== 400) {
    throw new Error("Negative quantity checkout should have returned 400");
  }

  // 3. Insufficient Stock Check (should return 400 Bad Request)
  console.log("Testing Insufficient Stock Protection...");
  // Set inventory of product 1 to 2
  await fetch(`${baseUrl}/api/admin/products/1/inventory`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}` 
    },
    body: JSON.stringify({ inventory: 2 })
  });

  const overStockRes = await fetch(`${baseUrl}/api/orders/create`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userToken}`
    },
    body: JSON.stringify({
      amount: 5595, // 3 * 1199 + 1999
      currency: "INR",
      customer_name: "Regular User",
      email: "user@aariniya.com",
      phone: "9876543210",
      address: testAddress,
      items: [
        { id: 1, name: "AARINIYA Deep Forest Multifloral Honey", price: 1199, qty: 3, isCourse: false },
        { id: 2, name: "Forest Morning Yoga Flow", price: 1999, qty: 1, isCourse: true }
      ]
    })
  });
  console.log(`- Insufficient stock response status: ${overStockRes.status}`);
  const overStockData = await overStockRes.json();
  console.log(`- Insufficient stock response: ${JSON.stringify(overStockData)}`);
  if (overStockRes.status !== 400 || !overStockData.error.includes('Insufficient stock')) {
    throw new Error("Insufficient stock check failed!");
  }

  // 4. Unauthorized Checkout Check (should return 401/403)
  console.log("Testing Unauthorized Checkout Protection...");
  const unauthCheckoutRes = await fetch(`${baseUrl}/api/orders/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount: 4397,
      currency: "INR",
      customer_name: "Regular User",
      email: "user@aariniya.com",
      phone: "9876543210",
      address: testAddress,
      items: testItems
    })
  });
  console.log(`- Unauthorized Checkout response status: ${unauthCheckoutRes.status}`);
  if (unauthCheckoutRes.status !== 401 && unauthCheckoutRes.status !== 403) {
    throw new Error("Unauthorized checkout should have failed with 401 or 403");
  }

  // 5. Nonexistent Order Verification Check (should return 404 Not Found)
  console.log("Testing Nonexistent Order Verification Protection...");
  const nonexistentOrderRes = await fetch(`${baseUrl}/api/orders/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      razorpay_order_id: 'order_mock_nonexistent',
      razorpay_payment_id: 'pay_mock_123',
      isMock: true
    })
  });
  console.log(`- Nonexistent Order Verification response status: ${nonexistentOrderRes.status}`);
  const nonexistentOrderData = await nonexistentOrderRes.json();
  console.log(`- Nonexistent Order Verification response: ${JSON.stringify(nonexistentOrderData)}`);
  if (nonexistentOrderRes.status !== 404 || nonexistentOrderData.error !== 'Order not found') {
    throw new Error("Nonexistent order verification should have returned 404 Order not found");
  }

  // 6. Negative/Decimal Inventory Updates (should return 400 Bad Request)
  console.log("Testing Negative Inventory Update Protection...");
  const negInventoryRes = await fetch(`${baseUrl}/api/admin/products/1/inventory`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}` 
    },
    body: JSON.stringify({ inventory: -10 })
  });
  console.log(`- Negative Inventory response status: ${negInventoryRes.status}`);
  if (negInventoryRes.status !== 400) {
    throw new Error("Negative inventory update should have failed with 400");
  }

  console.log("Testing Decimal Inventory Update Protection...");
  const decInventoryRes = await fetch(`${baseUrl}/api/admin/products/1/inventory`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}` 
    },
    body: JSON.stringify({ inventory: 5.5 })
  });
  console.log(`- Decimal Inventory response status: ${decInventoryRes.status}`);
  if (decInventoryRes.status !== 400) {
    throw new Error("Decimal inventory update should have failed with 400");
  }

  // 7. Double Payment / Verification Replay Check (should return 400 Bad Request)
  console.log("Testing Double Payment / Verification Replay Protection...");
  const doubleVerifyRes = await fetch(`${baseUrl}/api/orders/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      razorpay_order_id: mockOrderId,
      razorpay_payment_id: mockPaymentId,
      isMock: true
    })
  });
  console.log(`- Double Payment Verification response status: ${doubleVerifyRes.status}`);
  const doubleVerifyData = await doubleVerifyRes.json();
  console.log(`- Double Payment Verification response: ${JSON.stringify(doubleVerifyData)}`);
  if (doubleVerifyRes.status !== 400 || doubleVerifyData.error !== 'Order has already been processed and paid') {
    throw new Error("Double payment check protection failed!");
  }

  console.log("=== ALL TESTS PASSED SUCCESSFULLY! ===");
  process.exit(0);
}

runTests().catch(err => {
  console.error("=== TEST SUITE FAILED ===");
  console.error(err);
  process.exit(1);
});
