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
    const Database = sqlite3.Database || sqlite3.default?.Database;
    const db = new Database(dbPath);
    
    // Get current inventory to restore later
    const initialRow = await new Promise((res, rej) => {
      db.get("SELECT inventory FROM products WHERE id = 1", [], (err, row) => {
        if (err) rej(err);
        else res(row);
      });
    });
    initialInventory = initialRow.inventory;
    console.log(`Original inventory: ${initialInventory}`);
    db.close();

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
    console.log("Server is ready on port 5001. Starting pack integration tests...");

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
    console.log("Admin logged in successfully!");

    // 2. Fetch initial product details
    console.log("Step 2: Confirming honey product is seeded and retrieving details...");
    const prodRes = await fetch(`${baseUrl}/api/products/1`);
    if (!prodRes.ok) throw new Error("Failed to fetch product 1");
    const prodData = await prodRes.json();
    console.log(`Current honey product price in DB: ${prodData.price}`);

    // 3. Checkout a pack of 5 jars (total price 8450) and a pack of 2 jars (total price 3690)
    // Order total = 8450 + 3690 = 12140
    console.log("Step 3: Creating a checkout order for a 5-pack and a 2-pack...");
    const checkoutRes = await fetch(`${baseUrl}/api/orders/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        amount: 12140, // 8450 + 3690
        currency: 'INR',
        customer_name: 'Pack Test User',
        email: 'test@packoptions.com',
        phone: '9876543210',
        address: {
          address_line1: '123 Forest Rd',
          address_line2: 'M3 Suite',
          city: 'Dehradun',
          state: 'Uttarakhand',
          postal_code: '248001',
          country: 'India'
        },
        items: [
          { id: '1_pack_5', name: 'AARINIYA Deep Forest Honey (Pack of 5)', qty: 1, isCourse: false, packSize: 5, price: 8450 },
          { id: '1_pack_2', name: 'AARINIYA Deep Forest Honey (Pack of 2)', qty: 1, isCourse: false, packSize: 2, price: 3690 }
        ]
      })
    });
    if (!checkoutRes.ok) {
      const errText = await checkoutRes.text();
      throw new Error(`Pack checkout failed: ${checkoutRes.status} - ${errText}`);
    }
    const checkoutData = await checkoutRes.json();
    orderId = checkoutData.id;
    console.log(`Pack checkout initialized successfully with order ID: ${orderId}`);

    // 4. Verify payment
    console.log("Step 4: Verifying payment...");
    const verifyRes = await fetch(`${baseUrl}/api/orders/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        razorpay_order_id: orderId,
        razorpay_payment_id: 'pay_test_pack_5001',
        isMock: true
      })
    });
    if (!verifyRes.ok) {
      throw new Error(`Payment verification failed: ${verifyRes.statusText}`);
    }
    console.log("Payment verification successful!");

    // Wait a short time for DB operations to finalize
    await new Promise(r => setTimeout(r, 500));

    // 5. Verify that inventory decremented by 7 (5 + 2)
    console.log("Step 5: Checking inventory decrement...");
    const prodAfterRes = await fetch(`${baseUrl}/api/products/1`);
    if (!prodAfterRes.ok) throw new Error("Failed to fetch product 1 after order");
    const prodAfterData = await prodAfterRes.json();
    console.log(`Product 1 inventory after order: ${prodAfterData.inventory} (Initial was ${initialInventory})`);
    
    const expectedInventory = Math.max(0, initialInventory - 7);
    if (prodAfterData.inventory !== expectedInventory) {
      throw new Error(`Inventory did not decrement by 7. Expected ${expectedInventory}, got ${prodAfterData.inventory}`);
    }
    console.log("Inventory decrement of 7 verified successfully!");

    // 6. Verify receipt files contain pack details
    console.log("Step 6: Verifying receipt contents...");
    const receiptsDir = path.resolve(__dirname, '../logs/receipts');
    txtPath = path.join(receiptsDir, `receipt_${orderId}.txt`);
    htmlPath = path.join(receiptsDir, `receipt_${orderId}.html`);

    if (!fs.existsSync(txtPath) || !fs.existsSync(htmlPath)) {
      throw new Error("Pack receipt files were not generated");
    }

    const txtContent = fs.readFileSync(txtPath, 'utf8');
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');

    if (!txtContent.includes('AARINIYA Deep Forest Honey (Pack of 5)') || 
        !htmlContent.includes('AARINIYA Deep Forest Honey (Pack of 5)')) {
      throw new Error("Receipts do not contain 5-pack item name");
    }

    if (!txtContent.includes('AARINIYA Deep Forest Honey (Pack of 2)') || 
        !htmlContent.includes('AARINIYA Deep Forest Honey (Pack of 2)')) {
      throw new Error("Receipts do not contain 2-pack item name");
    }

    if (!txtContent.includes('INR 8450.00') || !htmlContent.includes('INR 8450.00') ||
        !txtContent.includes('INR 3690.00') || !htmlContent.includes('INR 3690.00') ||
        !txtContent.includes('INR 12140.00') || !htmlContent.includes('INR 12140.00')) {
      throw new Error("Receipts do not contain correct pricing details");
    }
    console.log("Pack receipt files and pricing details verified successfully!");

  } catch (err) {
    console.error("Pack Test failed with error:", err);
    process.exitCode = 1;
  } finally {
    console.log("Cleaning up pack test resources...");

    // Revert inventory and delete order in DB
    if (initialInventory !== null) {
      const Database = sqlite3.Database || sqlite3.default?.Database;
      const db = new Database(dbPath);
      try {
        if (orderId !== null) {
          await runQuery(db, "DELETE FROM orders WHERE razorpay_order_id = ?", [orderId]);
          console.log(`Cleaned up pack test order ${orderId} from DB`);
        }
        await runQuery(db, "UPDATE products SET inventory = ? WHERE id = 1", [initialInventory]);
        console.log(`Reverted product 1 inventory back to ${initialInventory}`);
      } catch (dbErr) {
        console.error("Error during database cleanup:", dbErr);
      } finally {
        db.close();
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
      await new Promise(r => {
        serverProcess.on('exit', () => r());
        setTimeout(r, 1000);
      });
    }

    console.log("Pack Test Suite Done");
    process.exit(process.exitCode || 0);
  }
}

main();
