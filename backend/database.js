import sqlite3 from 'sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, 'aariniya.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
    handleDbFailure(err);
  } else {
    db.run("PRAGMA foreign_keys = ON;");
    console.log('Connected to SQLite database at:', dbPath);
    initializeDatabase();
  }
});

function handleDbFailure(err) {
  console.warn('CRITICAL: Database schema error or corruption detected:', err.message);
  console.warn('Attempting self-healing by deleting database file to reset schema...');
  try {
    db.close(() => {
      try {
        if (fs.existsSync(dbPath)) {
          fs.unlinkSync(dbPath);
          console.log('Successfully deleted corrupted database file:', dbPath);
        }
      } catch (unlinkErr) {
        console.error('Failed to delete database file:', unlinkErr);
      }
      process.exit(1); // Exit with error so process manager restarts container
    });
  } catch (closeErr) {
    try {
      if (fs.existsSync(dbPath)) {
        fs.unlinkSync(dbPath);
      }
    } catch (e) {}
    process.exit(1);
  }
}

function initializeDatabase() {
  db.serialize(() => {
    const checkErr = (err, context) => {
      if (err) {
        console.error(`Database error during ${context}:`, err.message);
        handleDbFailure(err);
        return true;
      }
      return false;
    };

    // 1. Users Table
    db.run(`
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
        role TEXT DEFAULT 'user',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (checkErr(err, "creating users table")) return;
      
      db.all("PRAGMA table_info(users)", (err, rows) => {
        if (checkErr(err, "reading users table info")) return;
        
        const hasRole = rows.some(r => r.name === 'role');
        if (!hasRole) {
          db.run("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'", (alterErr) => {
            if (checkErr(alterErr, "adding role column to users")) return;
            console.log("Successfully migrated: added 'role' column to users table.");
            seedUsers();
          });
        } else {
          seedUsers();
        }
      });
    });

    // 2. Products Table
    db.run(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        subtitle TEXT,
        short_description TEXT,
        description TEXT,
        price REAL NOT NULL,
        original_price REAL,
        highlights TEXT,
        taste_profile TEXT,
        ways_to_enjoy TEXT,
        details TEXT,
        who_is_it_for TEXT,
        images TEXT,
        inventory INTEGER DEFAULT 100 CHECK(inventory >= 0)
      )
    `, (err) => {
      if (checkErr(err, "creating products table")) return;
      seedProducts();
    });

    // 3. Reviews Table
    db.run(`
      CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER,
        reviewer_name TEXT NOT NULL,
        title TEXT,
        rating INTEGER CHECK(rating >= 1 AND rating <= 5),
        review_text TEXT NOT NULL,
        tags TEXT,
        date DATETIME DEFAULT CURRENT_TIMESTAMP,
        helpful_count INTEGER DEFAULT 0,
        FOREIGN KEY(product_id) REFERENCES products(id)
      )
    `, (err) => {
      if (checkErr(err, "creating reviews table")) return;
      seedReviews();
    });

    // 4. Courses Table
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
        enrollment_status TEXT DEFAULT 'open' CHECK(enrollment_status IN ('open', 'closed'))
      )
    `, (err) => {
      if (checkErr(err, "creating courses table")) return;
      
      db.all("PRAGMA table_info(courses)", (err, rows) => {
        if (checkErr(err, "reading courses table info")) return;
        
        const hasStatus = rows.some(r => r.name === 'enrollment_status');
        if (!hasStatus) {
          db.run("ALTER TABLE courses ADD COLUMN enrollment_status TEXT DEFAULT 'open' CHECK(enrollment_status IN ('open', 'closed'))", (alterErr) => {
            if (checkErr(alterErr, "adding enrollment_status column to courses")) return;
            console.log("Successfully migrated: added 'enrollment_status' column to courses table.");
            seedCourses();
          });
        } else {
          seedCourses();
        }
      });
    });

    // 5. Orders Table
    db.run(`
      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        razorpay_order_id TEXT UNIQUE,
        razorpay_payment_id TEXT,
        user_id INTEGER,
        customer_name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT NOT NULL,
        address TEXT NOT NULL,
        items TEXT NOT NULL,
        total_amount REAL NOT NULL,
        payment_status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
      )
    `, (err) => {
      if (checkErr(err, "creating orders table")) return;
    });

    // 6. Quiz Leads Table
    db.run(`
      CREATE TABLE IF NOT EXISTS quiz_leads (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL,
        result_type TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (checkErr(err, "creating quiz_leads table")) return;
    });
  });
}

function seedProducts() {
  db.get("SELECT COUNT(*) as count FROM products", (err, row) => {
    if (err) return console.error(err);

    const description = "Raw, unfiltered, and unpasteurized. Harvested by tribal communities from the sal and mahua forests of Odisha and Jharkhand — one of India's most biodiverse forest corridors. No heat treatment. No added sugar. No blending from unknown sources. Every jar carries the natural pollen, enzymes, and micronutrients of a thousand wild forest flowers.";
    const short_desc = "Raw Forest Honey | Small Batch Packed | Premium Glass Jar | 900g";
    const price = 499;
    const original_price = 1970;

    const highlights = [
      "Deep Forest Sourced",
      "Raw Multifloral Honey",
      "Small Batch Packed",
      "Premium Glass Jar Packaging",
      "Rich Natural Aroma",
      "Distinctive Forest Flavor",
      "Carefully Selected",
      "Daily Wellness Ritual",
      "No Added Sugar",
      "No Artificial Flavors",
      "Crafted With Care"
    ];

    const tasteProfile = {
      flavor: "Rich, smooth, naturally sweet",
      aroma: "Deep floral and forest notes",
      texture: "Golden, thick, and luxurious",
      source: "Multifloral forest nectar"
    };

    const waysToEnjoy = [
      "Morning warm water ritual",
      "Herbal tea and green tea",
      "Smoothies and wellness drinks",
      "Breakfast bowls",
      "Toast and pancakes",
      "Healthy recipes",
      "Natural sweetening alternative"
    ];

    const details = {
      brand: "AARINIYA",
      product_name: "Deep Forest Multifloral Honey",
      net_weight: "900g",
      packaging: "Premium Glass Jar",
      honey_type: "Raw Multifloral Honey",
      origin: "Odisha & Jharkhand forests, India",
      storage: "Store in a cool and dry place. Keep lid tightly closed after use."
    };

    const whoIsItFor = [
      "Health-conscious individuals",
      "Families",
      "Fitness enthusiasts",
      "Wellness seekers",
      "Nature lovers",
      "Daily honey users",
      "Tea and herbal drink enthusiasts"
    ];

    const images = [
      "/assets/product_clean_shot.jpg",         // 1. Clean studio hero shot
      "/assets/product_jar_forest.jpg",          // 2. Forest setting — origin
      "/assets/product_founder_jar.jpg",         // 3. Founder holding jar — brand story
      "/assets/product_morning.jpg",             // 4. Morning ritual lifestyle
      "/assets/product_gift_box.jpg",            // 5. Premium packaging unboxing
      "/assets/product_wellbeing_triptych.jpg",  // 6. Yoga + jar + honey triptych
      "/assets/product_rituals.jpg",             // 7. One Spoon Many Rituals
      "/assets/product_wellness_blueprint.jpg",  // 8. Nature's Wellness Blueprint
      "/assets/product_comparison.jpg",          // 9. The Difference You Can Taste
      "/assets/product_forest_to_home.jpg"       // 10. From Deep Forests to Your Home
    ];

    if (row.count === 0) {
      const stmt = db.prepare(`
        INSERT INTO products (
          name, subtitle, short_description, description, price, original_price, 
          highlights, taste_profile, ways_to_enjoy, details, who_is_it_for, images
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        "AARINIYA Deep Forest Multifloral Honey",
        short_desc,
        description,
        description,
        price,
        original_price,
        JSON.stringify(highlights),
        JSON.stringify(tasteProfile),
        JSON.stringify(waysToEnjoy),
        JSON.stringify(details),
        JSON.stringify(whoIsItFor),
        JSON.stringify(images),
        (err) => {
          if (err) console.error("Error seeding product", err);
          else console.log("Seeded default Deep Forest Honey product.");
        }
      );
      stmt.finalize();
    } else {
      // Dynamic update to ensure existing database reflects the launch updates
      db.run(`
        UPDATE products SET 
          subtitle = ?,
          short_description = ?,
          description = ?,
          price = ?,
          original_price = ?,
          details = ?,
          images = ?
        WHERE id = 1
      `, [
        short_desc,
        description,
        description,
        price,
        original_price,
        JSON.stringify(details),
        JSON.stringify(images)
      ], (updateErr) => {
        if (updateErr) console.error("Error updating product 1:", updateErr);
        else console.log("Successfully updated product 1 with Central India details.");
      });
    }
  });
}

function seedReviews() {
  db.get("SELECT COUNT(*) as count FROM reviews", (err, row) => {
    if (err) return console.error(err);
    if (row.count === 0) {
      const reviews = [
        {
          product_id: 1,
          reviewer_name: "Priyanka S.",
          title: "Absolutely premium quality!",
          rating: 5,
          review_text: "The texture is thick, golden and has a very unique earthy/woody aroma which you will never find in commercial honey. Highly recommend it with morning warm water.",
          tags: JSON.stringify(["thick", "earthy", "premium"]),
          date: "2026-05-15 10:30:00",
          helpful_count: 24
        },
        {
          product_id: 1,
          reviewer_name: "Amit K.",
          title: "Very rich flavor",
          rating: 4,
          review_text: "It tastes pure and less artificially sweet than standard supermarket brands. The glass packaging feels very premium too, looks great on my breakfast table.",
          tags: JSON.stringify(["pure", "premium jar"]),
          date: "2026-05-20 14:15:00",
          helpful_count: 12
        },
        {
          product_id: 1,
          reviewer_name: "Meera Dev",
          title: "Pure forest goodness",
          rating: 5,
          review_text: "Aariniya has really set a high standard. This honey has a beautiful floral note. I use it in my herbal teas. It has become a vital part of my daily wellness routine.",
          tags: JSON.stringify(["floral notes", "daily ritual"]),
          date: "2026-06-02 09:00:00",
          helpful_count: 18
        },
        {
          product_id: 1,
          reviewer_name: "sakshi singh",
          title: "Excellent purity",
          rating: 5,
          review_text: "This honey is very light weight on the stomach, melts in warm water smoothly, and keeps me energized. Love the packaging and the sweet, woody smell. Currently using it daily.",
          tags: JSON.stringify(["light", "sweet aroma"]),
          date: "2026-06-04 18:22:00",
          helpful_count: 15
        },
        {
          product_id: 1,
          reviewer_name: "Anonymous",
          title: "Love it",
          rating: 5,
          review_text: "I recently tried the Aariniya honey and I really liked it. The texture is smooth and it absorbs well in warm lemon water. Keeps me hydrated for a long time.",
          tags: JSON.stringify(["hydrating", "smooth"]),
          date: "2026-06-05 11:05:00",
          helpful_count: 9
        },
        {
          product_id: 1,
          reviewer_name: "Rajesh M.",
          title: "Genuinely raw honey",
          rating: 5,
          review_text: "It crystallizes slightly at the bottom which is proof that it is raw and unfiltered. Tastes incredible, very natural earthy undertones.",
          tags: JSON.stringify(["unfiltered", "raw"]),
          date: "2026-06-06 09:40:00",
          helpful_count: 11
        },
        {
          product_id: 1,
          reviewer_name: "Neha Sharma",
          title: "Breathtaking aroma",
          rating: 5,
          review_text: "The aroma of wild forest flowers hits you the moment you open the jar. Highly recommended for wellness seekers.",
          tags: JSON.stringify(["aroma", "wild forest"]),
          date: "2026-06-07 16:15:00",
          helpful_count: 14
        },
        {
          product_id: 1,
          reviewer_name: "Dr. Amit Verma",
          title: "Highly recommended",
          rating: 5,
          review_text: "As a health professional, I highly recommend raw unheated honey over processed sugar. Aariniya provides pure forest quality.",
          tags: JSON.stringify(["pure quality", "raw"]),
          date: "2026-06-08 10:50:00",
          helpful_count: 22
        }
      ];

      const stmt = db.prepare("INSERT INTO reviews (product_id, reviewer_name, title, rating, review_text, tags, date, helpful_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
      reviews.forEach(r => {
        stmt.run(r.product_id, r.reviewer_name, r.title, r.rating, r.review_text, r.tags, r.date, r.helpful_count);
      });
      stmt.finalize();
      console.log("Seeded initial product reviews with titles.");
    }
  });
}

function seedCourses() {
  db.get("SELECT COUNT(*) as count FROM courses", (err, row) => {
    if (err) return console.error(err);
    if (row.count === 0) {
      const courses = [
        {
          title: "Forest Morning Yoga Flow",
          subtitle: "21-Day Guided Vinyasa for Strength & Mindful Living",
          description: "Connect your body with the rhythm of the forest. This yoga course brings dynamic movements, deep stretches, and mindful breathing protocols to kickstart your day with high energy and calm focus.",
          price: 1999,
          type: "yoga",
          duration: "21 Days (30-min daily sessions)",
          image: "/assets/course_yoga_morning.png"
        },
        {
          title: "Deep Breathing & Meditation Rituals",
          subtitle: "Mastering Pranayama and Stress Release",
          description: "Stressed and overwhelmed by modern city pace? Learn deep breathing techniques inspired by the natural serenity of mountains and forests to calm the nervous system and boost immune system functioning.",
          price: 999,
          type: "yoga",
          duration: "10 Days (15-min daily sessions)",
          image: "/assets/course_yoga_breathing.png"
        },
        {
          title: "The Aariniya Whole-Foods Diet Plan",
          subtitle: "A Complete Guide to Mindful Nutrition & Natural Sweeteners",
          description: "A comprehensive diet protocol focusing on unprocessed whole foods, anti-inflammatory forest ingredients, and elimination of refined sugar. Includes meal plans, herbal recipes, and honey-based wellness drinks.",
          price: 1499,
          type: "diet",
          duration: "4-Week Plan & Recipe Guide",
          image: "/assets/course_diet_plan.png"
        }
      ];

      const stmt = db.prepare("INSERT INTO courses (title, subtitle, description, price, type, duration, image) VALUES (?, ?, ?, ?, ?, ?, ?)");
      courses.forEach(c => {
        stmt.run(c.title, c.subtitle, c.description, c.price, c.type, c.duration, c.image);
      });
      stmt.finalize();
      console.log("Seeded initial courses and diet plans.");
    }
  });
}

function seedUsers() {
  const usersToSeed = [
    { email: 'admin@aariniya.com', password: 'admin123', name: 'Admin User', role: 'admin' },
    { email: 'user@aariniya.com', password: 'user123', name: 'Regular User', role: 'user' }
  ];

  usersToSeed.forEach(u => {
    db.get("SELECT id FROM users WHERE email = ?", [u.email], (err, row) => {
      if (err) {
        console.error("Error checking user existence:", err);
        return;
      }
      if (!row) {
        const salt = bcrypt.genSaltSync(10);
        const hash = bcrypt.hashSync(u.password, salt);
        db.run(
          "INSERT INTO users (email, password_hash, full_name, role) VALUES (?, ?, ?, ?)",
          [u.email, hash, u.name, u.role],
          (insertErr) => {
            if (insertErr) {
              console.error(`Error seeding user ${u.email}:`, insertErr);
            } else {
              console.log(`Seeded user: ${u.email} (${u.role})`);
            }
          }
        );
      }
    });
  });
}

export default db;
