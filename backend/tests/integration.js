import { fork } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import sqlite3 from 'sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, '../aariniya.db');

const baseUrl = 'http://localhost:5001';

function runQuery(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

async function main() {
  let serverProcess;
  let initialInventory = null;
  let orderId = null;
  let txtPath = null;
  let htmlPath = null;

  try {
    console.log("Starting test server on port 5001...");
    serverProcess = fork(path.resolve(__dirname, '../server.js'), [], {
      env: { ...process.env, PORT: '5001', NODE_ENV: 'test' },
      silent: true
    });

    serverProcess.stdout.on('data', (data) => {
      console.log(`[Server stdout] ${data.toString().trim()}`);
    });

    serverProcess.stderr.on('data', (data) => {
      console.error(`[Server stderr] ${data.toString().trim()}`);
    });

    // Wait for server to respond
    let serverReady = false;
    for (let i = 0; i < 20; i++) {
      try {
        const res = await fetch(`${baseUrl}/api/products`);
        if (res.status === 200) {
          serverReady = true;
          break;
        }
      } catch (e) {
        // Server not ready yet
      }
      await new Promise(r => setTimeout(r, 250));
    }

    if (!serverReady) {
      throw new Error('Test server failed to respond on port 5001 within timeout');
    }
    console.log("Server is ready on port 5001. Starting integration tests...");

    // 1. Log in as seeded admin
    console.log("Step 1: Logging in as admin...");
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@aariniya.com', password: 'admin123' })
    });
    if (!loginRes.ok) {
      throw new Error(`Admin login failed: ${loginRes.statusText}`);
    }
    const loginData = await loginRes.json();
    const token = loginData.token;
    if (!token) {
      throw new Error("No token returned on admin login");
    }
    console.log("Admin logged in successfully!");

    // 2. Query and verify API auth
    console.log("Step 2: Querying and verifying API auth...");
    const profileRes = await fetch(`${baseUrl}/api/user/profile`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!profileRes.ok) {
      throw new Error(`Profile query failed: ${profileRes.statusText}`);
    }
    const profileData = await profileRes.json();
    if (profileData.email !== 'admin@aariniya.com' || profileData.role !== 'admin') {
      throw new Error(`Profile verification failed. Expected admin, got: ${JSON.stringify(profileData)}`);
    }
    console.log("API Auth verified!");

    // 3. Fetch initial inventory of Product 1 and initial admin dashboard stats
    console.log("Step 3: Fetching initial inventory and stats...");
    const prodRes = await fetch(`${baseUrl}/api/products/1`);
    if (!prodRes.ok) {
      throw new Error(`Failed to fetch Product 1: ${prodRes.statusText}`);
    }
    const prodData = await prodRes.json();
    initialInventory = prodData.inventory;
    console.log(`Product 1 initial inventory: ${initialInventory}`);

    const statsRes = await fetch(`${baseUrl}/api/admin/dashboard-stats`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!statsRes.ok) {
      throw new Error(`Failed to fetch admin stats: ${statsRes.statusText}`);
    }
    const statsData = await statsRes.json();
    const initialRevenue = statsData.revenue;
    const initialOrderCount = statsData.orderCount;
    console.log(`Initial stats - Revenue: ${initialRevenue}, Order Count: ${initialOrderCount}`);

    // 4. Create a checkout order
    console.log("Step 4: Creating a checkout order...");
    const checkoutRes = await fetch(`${baseUrl}/api/orders/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        amount: 2498, // 499 (Product 1) + 1999 (Course 1)
        currency: 'INR',
        customer_name: 'Admin Test User',
        email: 'admin@aariniya.com',
        phone: '9876543210',
        address: {
          address_line1: '456 Forest Rd',
          address_line2: 'M3 Suite',
          city: 'Dehradun',
          state: 'Uttarakhand',
          postal_code: '248001',
          country: 'India'
        },
        items: [
          { id: 1, name: 'AARINIYA Deep Forest Multifloral Honey', qty: 1, isCourse: false },
          { id: 'course_1', name: 'Forest Morning Yoga Flow', qty: 1, isCourse: true }
        ]
      })
    });
    if (!checkoutRes.ok) {
      const errText = await checkoutRes.text();
      throw new Error(`Order creation failed: ${checkoutRes.status} - ${errText}`);
    }
    const checkoutData = await checkoutRes.json();
    orderId = checkoutData.id;
    if (!orderId) {
      throw new Error(`No order ID in checkout response: ${JSON.stringify(checkoutData)}`);
    }
    console.log(`Order created successfully with ID: ${orderId}`);

    // 5. Verify payment via POST /api/orders/verify
    console.log("Step 5: Verifying payment...");
    const verifyRes = await fetch(`${baseUrl}/api/orders/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        razorpay_order_id: orderId,
        razorpay_payment_id: 'pay_test_integration_5001',
        isMock: true
      })
    });
    if (!verifyRes.ok) {
      const errText = await verifyRes.text();
      throw new Error(`Payment verification failed: ${verifyRes.status} - ${errText}`);
    }
    const verifyData = await verifyRes.json();
    if (verifyData.status !== 'success') {
      throw new Error(`Payment verification not successful: ${JSON.stringify(verifyData)}`);
    }
    console.log("Payment verification successful!");

    // Wait a short time for DB operations to finalize
    await new Promise(r => setTimeout(r, 500));

    // 6. Check that Product 1's inventory has decreased by 1
    console.log("Step 6: Checking inventory decrement...");
    const prodAfterRes = await fetch(`${baseUrl}/api/products/1`);
    if (!prodAfterRes.ok) {
      throw new Error(`Failed to fetch Product 1 after order: ${prodAfterRes.statusText}`);
    }
    const prodAfterData = await prodAfterRes.json();
    console.log(`Product 1 inventory after order: ${prodAfterData.inventory}`);
    if (prodAfterData.inventory !== initialInventory - 1) {
      throw new Error(`Inventory did not decrement by 1. Expected ${initialInventory - 1}, got ${prodAfterData.inventory}`);
    }
    console.log("Inventory decrement verified!");

    // 7. Check that both receipt files (TXT and HTML) exist and check contents
    console.log("Step 7: Verifying receipt files...");
    const receiptsDir = path.resolve(__dirname, '../logs/receipts');
    txtPath = path.join(receiptsDir, `receipt_${orderId}.txt`);
    htmlPath = path.join(receiptsDir, `receipt_${orderId}.html`);

    if (!fs.existsSync(txtPath)) {
      throw new Error(`TXT receipt file missing at ${txtPath}`);
    }
    if (!fs.existsSync(htmlPath)) {
      throw new Error(`HTML receipt file missing at ${htmlPath}`);
    }

    const txtContent = fs.readFileSync(txtPath, 'utf8');
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');

    if (!txtContent.includes(orderId) || !htmlContent.includes(orderId)) {
      throw new Error("Receipts do not contain order ID");
    }
    if (!txtContent.includes('AARINIYA Deep Forest Multifloral Honey') || !htmlContent.includes('AARINIYA Deep Forest Multifloral Honey')) {
      throw new Error("Receipts do not contain Product 1 name");
    }
    if (!txtContent.includes('Forest Morning Yoga Flow') || !htmlContent.includes('Forest Morning Yoga Flow')) {
      throw new Error("Receipts do not contain Course 1 name");
    }
    console.log("Receipt files and contents verified successfully!");

    // 8. Fetch admin stats again and check they are updated
    console.log("Step 8: Verifying dashboard stats update...");
    const statsAfterRes = await fetch(`${baseUrl}/api/admin/dashboard-stats`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!statsAfterRes.ok) {
      throw new Error(`Failed to fetch dashboard stats after order: ${statsAfterRes.statusText}`);
    }
    const statsAfterData = await statsAfterRes.json();
    console.log(`Updated stats - Revenue: ${statsAfterData.revenue}, Order Count: ${statsAfterData.orderCount}`);

    if (statsAfterData.revenue !== initialRevenue + 2498) {
      throw new Error(`Revenue did not increase by 2498. Expected ${initialRevenue + 2498}, got ${statsAfterData.revenue}`);
    }
    if (statsAfterData.orderCount !== initialOrderCount + 1) {
      throw new Error(`Order count did not increase by 1. Expected ${initialOrderCount + 1}, got ${statsAfterData.orderCount}`);
    }
    console.log("Dashboard stats updated correctly!");
    console.log("All E2E checkout checks completed successfully!");

  } catch (err) {
    console.error("Test failed with error:", err);
    process.exitCode = 1;
  } finally {
    // 9. Cleanup
    console.log("Cleaning up...");

    // Revert inventory and delete order in DB
    if (initialInventory !== null && orderId !== null) {
      const Database = sqlite3.Database || sqlite3.default?.Database;
      if (Database) {
        const db = new Database(dbPath);
        try {
          await runQuery(db, "DELETE FROM orders WHERE razorpay_order_id = ?", [orderId]);
          console.log(`Cleaned up test order ${orderId} from DB`);

          await runQuery(db, "UPDATE products SET inventory = ? WHERE id = 1", [initialInventory]);
          console.log(`Reverted product 1 inventory to ${initialInventory}`);
        } catch (dbErr) {
          console.error("Error during database cleanup:", dbErr);
        } finally {
          db.close();
        }
      }
    }

    // Delete receipt files
    try {
      if (txtPath && fs.existsSync(txtPath)) {
        fs.unlinkSync(txtPath);
        console.log(`Deleted receipt file: ${txtPath}`);
      }
      if (htmlPath && fs.existsSync(htmlPath)) {
        fs.unlinkSync(htmlPath);
        console.log(`Deleted receipt file: ${htmlPath}`);
      }
    } catch (fsErr) {
      console.error("Error deleting receipt files:", fsErr);
    }

    // Shutdown test server
    if (serverProcess) {
      console.log("Stopping test server...");
      serverProcess.kill('SIGTERM');
      // Wait for process to exit
      await new Promise(r => {
        serverProcess.on('exit', () => r());
        setTimeout(r, 1000);
      });
    }

    console.log("Handoff report preparation: Done");
    process.exit(process.exitCode || 0);
  }
}

main();
