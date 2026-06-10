import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new sqlite3.Database(path.resolve(__dirname, 'aariniya.db'));

// Sorted logically for a premium product page:
// 1. Clean product hero shots first
// 2. Lifestyle / brand story shots 
// 3. Informational infographics last
const newImages = JSON.stringify([
  '/assets/product_clean_shot.jpg',        // 1. Clean studio shot — first impression
  '/assets/product_jar_forest.jpg',        // 2. Forest setting — origin story
  '/assets/product_founder_jar.jpg',       // 3. Founder/tribal woman — brand story
  '/assets/product_morning.jpg',           // 4. Morning ritual lifestyle
  '/assets/product_gift_box.jpg',          // 5. Premium packaging unboxing
  '/assets/product_wellbeing_triptych.jpg',// 6. Yoga + jar + honey drip lifestyle
  '/assets/product_rituals.jpg',           // 7. One Spoon Many Rituals infographic
  '/assets/product_wellness_blueprint.jpg',// 8. Nature's Wellness Blueprint
  '/assets/product_comparison.jpg',        // 9. The Difference You Can Taste
  '/assets/product_forest_to_home.jpg',   // 10. From Deep Forests to Your Home
]);

db.run('UPDATE products SET images = ? WHERE id = 1', [newImages], function(err) {
  if (err) {
    console.error('Error:', err);
  } else {
    console.log('✅ All 10 product images updated and sorted! Rows changed:', this.changes);
  }
  db.close();
});
