import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, '../../../backend/aariniya.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
    process.exit(1);
  } else {
    // Enable FK
    db.run("PRAGMA foreign_keys = ON;", (pragmaErr) => {
      if (pragmaErr) {
        console.error("Failed to enable foreign keys:", pragmaErr);
        process.exit(1);
      }
      
      // Try to insert a review with non-existent product_id = 99999
      const query = `
        INSERT INTO reviews (product_id, reviewer_name, rating, review_text, tags)
        VALUES (99999, 'Test Attacker', 5, 'Fake review', '["fake"]')
      `;
      
      db.run(query, [], function(insertErr) {
        if (insertErr) {
          console.log("SUCCESS: Insertion failed as expected under Foreign Key Enforcement.");
          console.log("Error details:", insertErr.message);
          db.close();
          process.exit(0);
        } else {
          console.error("FAILURE: Insertion succeeded! Foreign Key Enforcement IS NOT WORKING!");
          db.close();
          process.exit(1);
        }
      });
    });
  }
});
