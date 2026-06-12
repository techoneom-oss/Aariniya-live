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
    console.log("Setting initial product inventory to 0 for preorder testing...");
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
    
    // Set to 0
    await runQuery(db, "UPDATE products SET inventory = 0 WHERE id = 1");
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
    console.log("Server is ready on port 5001. Starting preorder integration tests...");

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

    // 2. Fetch and confirm inventory is 0
    console.log("Step 2: Confirming honey inventory is 0...");
    const prodRes = await fetch(`${baseUrl}/api/products/1`);
    if (!prodRes.ok) throw new Error("Failed to fetch product 1");
    const prodData = await prodRes.json();
    if (prodData.inventory !== 0) {
      throw new Error(`Expected inventory to be 0, but got: ${prodData.inventory}`);
    }
    console.log("Honey inventory is confirmed to be 0!");

    // 3. Attempt checkout WITHOUT preorder flag and expect it to fail (400)
    console.log("Step 3: Testing checkout without preorder flag (expecting failure)...");
    const failRes = await fetch(`${baseUrl}/api/orders/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        amount: 499,
        currency: 'INR',
        customer_name: 'Preorder Test User',
        email: 'test@preorder.com',
        phone: '9876543210',
        address: {
          address_line1: '123 Honey St',
          address_line2: 'M3 Suite',
          city: 'Dehradun',
          state: 'Uttarakhand',
          postal_code: '248001',
          country: 'India'
        },
        items: [
          { id: 1, name: 'AARINIYA Deep Forest Multifloral Honey', qty: 1, isCourse: false } // No isPreorder: true
        ]
      })
    });
    if (failRes.ok) {
      throw new Error("Checkout succeeded when it should have failed due to out of stock");
    }
    const failText = await failRes.text();
    console.log(`Checkout failed as expected with status ${failRes.status}: ${failText}`);

    // 4. Attempt checkout WITH preorder flag and expect it to succeed
    console.log("Step 4: Testing checkout WITH preorder flag (expecting success)...");
    const successRes = await fetch(`${baseUrl}/api/orders/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        amount: 499,
        currency: 'INR',
        customer_name: 'Preorder Test User',
        email: 'test@preorder.com',
        phone: '9876543210',
        address: {
          address_line1: '123 Honey St',
          address_line2: 'M3 Suite',
          city: 'Dehradun',
          state: 'Uttarakhand',
          postal_code: '248001',
          country: 'India'
        },
        items: [
          { id: 1, name: 'AARINIYA Deep Forest Multifloral Honey (Pre-order)', qty: 1, isCourse: false, isPreorder: true }
        ]
      })
    });
    if (!successRes.ok) {
      const errText = await successRes.text();
      throw new Error(`Preorder checkout failed: ${successRes.status} - ${errText}`);
    }
    const successData = await successRes.json();
    orderId = successData.id;
    console.log(`Preorder checkout initialized successfully with order ID: ${orderId}`);

    // 5. Verify payment
    console.log("Step 5: Verifying preorder payment...");
    const verifyRes = await fetch(`${baseUrl}/api/orders/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        razorpay_order_id: orderId,
        razorpay_payment_id: 'pay_test_preorder_5001',
        isMock: true
      })
    });
    if (!verifyRes.ok) {
      throw new Error(`Payment verification failed: ${verifyRes.statusText}`);
    }
    console.log("Payment verification successful!");

    // Wait a short time for DB operations to finalize
    await new Promise(r => setTimeout(r, 500));

    // 6. Verify that inventory remains 0
    console.log("Step 6: Confirming honey inventory remains 0...");
    const prodAfterRes = await fetch(`${baseUrl}/api/products/1`);
    if (!prodAfterRes.ok) throw new Error("Failed to fetch product 1 after order");
    const prodAfterData = await prodAfterRes.json();
    if (prodAfterData.inventory !== 0) {
      throw new Error(`Expected inventory to remain 0, but got: ${prodAfterData.inventory}`);
    }
    console.log("Honey inventory remains 0 successfully!");

    // 7. Verify receipt files contain Pre-order markings
    console.log("Step 7: Verifying receipt contents for preorder label...");
    const receiptsDir = path.resolve(__dirname, '../logs/receipts');
    txtPath = path.join(receiptsDir, `receipt_${orderId}.txt`);
    htmlPath = path.join(receiptsDir, `receipt_${orderId}.html`);

    if (!fs.existsSync(txtPath) || !fs.existsSync(htmlPath)) {
      throw new Error("Preorder receipt files were not generated");
    }

    const txtContent = fs.readFileSync(txtPath, 'utf8');
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');

    if (!txtContent.includes('AARINIYA Deep Forest Multifloral Honey (Pre-order)') || 
        !htmlContent.includes('AARINIYA Deep Forest Multifloral Honey (Pre-order)')) {
      throw new Error("Receipts do not contain Product preorder name");
    }

    if (!txtContent.includes('[Physical] (Pre-order)') || 
        !htmlContent.includes('Physical (Pre-order)')) {
      throw new Error("Receipts do not contain Physical (Pre-order) type string");
    }
    console.log("Preorder receipt files and contents verified successfully!");

  } catch (err) {
    console.error("Preorder Test failed with error:", err);
    process.exitCode = 1;
  } finally {
    console.log("Cleaning up preorder test resources...");

    // Revert inventory and delete order in DB
    if (initialInventory !== null) {
      const Database = sqlite3.Database || sqlite3.default?.Database;
      const db = new Database(dbPath);
      try {
        if (orderId !== null) {
          await runQuery(db, "DELETE FROM orders WHERE razorpay_order_id = ?", [orderId]);
          console.log(`Cleaned up preorder test order ${orderId} from DB`);
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

    console.log("Preorder Test Suite Done");
    process.exit(process.exitCode || 0);
  }
}

main();
