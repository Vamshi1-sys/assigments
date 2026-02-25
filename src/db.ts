import Database from 'better-sqlite3';
import path from 'path';

const db = new Database('platform.db');

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT CHECK(role IN ('student', 'admin', 'writer', 'delivery')) DEFAULT 'student',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    writer_id INTEGER,
    delivery_id INTEGER,
    title TEXT NOT NULL,
    description TEXT,
    file_path TEXT,
    page_count INTEGER DEFAULT 0,
    price_per_page REAL DEFAULT 40,
    price REAL DEFAULT 0,
    status TEXT CHECK(status IN ('pending', 'assigned', 'writing', 'ready_for_delivery', 'out_for_delivery', 'delivered')) DEFAULT 'pending',
    due_date DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(student_id) REFERENCES users(id),
    FOREIGN KEY(writer_id) REFERENCES users(id),
    FOREIGN KEY(delivery_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS status_updates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    status TEXT NOT NULL,
    message TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(order_id) REFERENCES orders(id)
  );

  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    text TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(order_id) REFERENCES orders(id),
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    message TEXT NOT NULL,
    is_read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

// Migration: Add price_per_page if it doesn't exist
try {
  db.prepare('SELECT price_per_page FROM orders LIMIT 1').get();
} catch (e) {
  db.exec('ALTER TABLE orders ADD COLUMN price_per_page REAL DEFAULT 40');
}

// Migration: Add due_date if it doesn't exist
try {
  db.prepare('SELECT due_date FROM orders LIMIT 1').get();
} catch (e) {
  db.exec('ALTER TABLE orders ADD COLUMN due_date DATETIME');
}

// Seed admin if not exists
const adminExists = db.prepare('SELECT * FROM users WHERE role = ?').get('admin');
if (!adminExists) {
  db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)').run(
    'Admin User',
    'admin@example.com',
    'admin123', // In real app, hash this
    'admin'
  );
}

// Seed a writer and delivery agent for demo
const writerExists = db.prepare('SELECT * FROM users WHERE role = ?').get('writer');
if (!writerExists) {
  db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)').run(
    'John Writer',
    'writer@example.com',
    'writer123',
    'writer'
  );
}

const deliveryExists = db.prepare('SELECT * FROM users WHERE role = ?').get('delivery');
if (!deliveryExists) {
  db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)').run(
    'Mike Delivery',
    'delivery@example.com',
    'delivery123',
    'delivery'
  );
}

export default db;
