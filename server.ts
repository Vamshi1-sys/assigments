import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import multer from 'multer';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import db from './src/db.js';
import fs from 'fs';

const JWT_SECRET = 'your-secret-key'; // In production, use env var

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Ensure uploads directory exists
  const uploadDir = 'uploads';
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
  }

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + '-' + file.originalname);
    }
  });

  const upload = multer({ storage });

  // Auth Middleware
  const authenticate = (req: any, res: any, next: any) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      next();
    } catch (err) {
      res.status(401).json({ error: 'Invalid token' });
    }
  };

  // --- API Routes ---

  // Notifications
  app.get('/api/notifications', authenticate, (req: any, res) => {
    // Check for upcoming deadlines and create notifications if they don't exist
    const upcomingOrders = db.prepare(`
      SELECT id, title, due_date FROM orders 
      WHERE (student_id = ? OR writer_id = ?) 
      AND status NOT IN ('delivered') 
      AND due_date IS NOT NULL 
      AND due_date > datetime('now') 
      AND due_date < datetime('now', '+24 hours')
    `).all(req.user.id, req.user.id) as any[];

    upcomingOrders.forEach(order => {
      const msg = `Deadline approaching for order #${order.id}: ${order.title} (Due: ${order.due_date})`;
      const exists = db.prepare('SELECT id FROM notifications WHERE user_id = ? AND message = ?').get(req.user.id, msg);
      if (!exists) {
        db.prepare('INSERT INTO notifications (user_id, message) VALUES (?, ?)').run(req.user.id, msg);
      }
    });

    const notifications = db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 20').all(req.user.id);
    res.json(notifications);
  });

  app.post('/api/notifications/read', authenticate, (req: any, res) => {
    db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(req.user.id);
    res.json({ success: true });
  });

  // Admin Analytics
  app.get('/api/admin/stats', authenticate, (req: any, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    
    const totalRevenue = db.prepare("SELECT SUM(price) as total FROM orders WHERE status = 'delivered'").get() as any;
    const pendingOrders = db.prepare("SELECT COUNT(*) as count FROM orders WHERE status = 'pending'").get() as any;
    const activeWriters = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'writer'").get() as any;
    const totalOrders = db.prepare('SELECT COUNT(*) as count FROM orders').get() as any;
    const recentOrders = db.prepare(`
      SELECT o.title, o.price, u.name as student_name 
      FROM orders o 
      JOIN users u ON o.student_id = u.id 
      ORDER BY o.created_at DESC LIMIT 5
    `).all();
    
    res.json({
      revenue: totalRevenue.total || 0,
      pending: pendingOrders.count,
      writers: activeWriters.count,
      totalOrders: totalOrders.count,
      recentOrders
    });
  });

  // Earnings
  app.get('/api/earnings', authenticate, (req: any, res) => {
    let earnings;
    if (req.user.role === 'writer') {
      earnings = db.prepare("SELECT SUM(price * 0.7) as total FROM orders WHERE writer_id = ? AND status = 'delivered'").get(req.user.id) as any;
    } else if (req.user.role === 'delivery') {
      earnings = db.prepare("SELECT COUNT(*) * 30 as total FROM orders WHERE delivery_id = ? AND status = 'delivered'").get(req.user.id) as any;
    } else {
      return res.status(400).json({ error: 'Not applicable' });
    }
    res.json({ total: earnings.total || 0 });
  });

  // Auth
  app.post('/api/auth/register', (req, res) => {
    const { name, email, password, role } = req.body;
    try {
      const stmt = db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)');
      const result = stmt.run(name, email, password, role || 'student');
      const token = jwt.sign({ id: result.lastInsertRowid, email, role: role || 'student', name }, JWT_SECRET);
      res.json({ token, user: { id: result.lastInsertRowid, name, email, role: role || 'student' } });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE email = ? AND password = ?').get(email, password) as any;
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET);
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  });

  // Orders
  app.post('/api/orders', authenticate, upload.single('file'), (req: any, res) => {
    const { title, description, due_date } = req.body;
    const file = req.file;
    const student_id = req.user.id;

    // Use provided page count or default to 1
    const page_count = parseInt(req.body.page_count) || 1;
    const price_per_page = 40; 
    const price = page_count * price_per_page;

    const stmt = db.prepare('INSERT INTO orders (student_id, title, description, file_path, page_count, price_per_page, price, due_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    const result = stmt.run(student_id, title, description, file ? file.path : null, page_count, price_per_page, price, due_date || null);
    
    // Initial status update
    db.prepare('INSERT INTO status_updates (order_id, status, message) VALUES (?, ?, ?)').run(result.lastInsertRowid, 'pending', 'Order placed successfully');

    // Notify Admins
    const admins = db.prepare("SELECT id FROM users WHERE role = 'admin'").all() as any[];
    admins.forEach(admin => {
      db.prepare('INSERT INTO notifications (user_id, message) VALUES (?, ?)').run(admin.id, `New order #${result.lastInsertRowid} received: ${title}`);
    });

    res.json({ id: result.lastInsertRowid, page_count, price });
  });

  app.get('/api/orders', authenticate, (req: any, res) => {
    let orders;
    if (req.user.role === 'admin') {
      orders = db.prepare(`
        SELECT o.*, u.name as student_name 
        FROM orders o 
        JOIN users u ON o.student_id = u.id 
        ORDER BY o.created_at DESC
      `).all();
    } else if (req.user.role === 'writer') {
      orders = db.prepare("SELECT * FROM orders WHERE writer_id = ? OR status = 'pending'").all(req.user.id);
    } else if (req.user.role === 'delivery') {
      orders = db.prepare("SELECT * FROM orders WHERE delivery_id = ? OR status = 'ready_for_delivery'").all(req.user.id);
    } else {
      orders = db.prepare('SELECT * FROM orders WHERE student_id = ? ORDER BY created_at DESC').all(req.user.id);
    }
    res.json(orders);
  });

  app.get('/api/orders/:id', authenticate, (req: any, res) => {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id) as any;
    const updates = db.prepare('SELECT * FROM status_updates WHERE order_id = ? ORDER BY updated_at DESC').all(req.params.id);
    const comments = db.prepare(`
      SELECT c.*, u.name as user_name, u.role as user_role 
      FROM comments c 
      JOIN users u ON c.user_id = u.id 
      WHERE c.order_id = ? 
      ORDER BY c.created_at ASC
    `).all(req.params.id);
    res.json({ ...order, updates, comments });
  });

  app.post('/api/orders/:id/comments', authenticate, (req: any, res) => {
    const { text } = req.body;
    const order_id = req.params.id;
    const user_id = req.user.id;
    
    db.prepare('INSERT INTO comments (order_id, user_id, text) VALUES (?, ?, ?)').run(order_id, user_id, text);

    // Notify other parties
    const order = db.prepare('SELECT student_id, writer_id, title FROM orders WHERE id = ?').get(order_id) as any;
    const recipients = new Set([order.student_id, order.writer_id].filter(id => id && id !== user_id));
    
    // Also notify admins if they are not the sender
    if (req.user.role !== 'admin') {
      const admins = db.prepare("SELECT id FROM users WHERE role = 'admin'").all() as any[];
      admins.forEach(admin => recipients.add(admin.id));
    }

    recipients.forEach(rid => {
      db.prepare('INSERT INTO notifications (user_id, message) VALUES (?, ?)').run(rid, `New message on order #${order_id} "${order.title}": ${text.substring(0, 50)}...`);
    });

    res.json({ success: true });
  });

  // Admin Actions
  // Admin Actions - Analytics
  app.get('/api/admin/analytics', authenticate, (req: any, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    
    const stats = {
      totalRevenue: db.prepare("SELECT SUM(price) as total FROM orders WHERE status = 'delivered'").get() as any,
      activeOrders: db.prepare("SELECT COUNT(*) as count FROM orders WHERE status != 'delivered'").get() as any,
      completedOrders: db.prepare("SELECT COUNT(*) as count FROM orders WHERE status = 'delivered'").get() as any,
      totalUsers: db.prepare("SELECT COUNT(*) as count FROM users").get() as any,
      recentOrders: db.prepare(`
        SELECT o.title, o.price, u.name as student_name 
        FROM orders o 
        JOIN users u ON o.student_id = u.id 
        ORDER BY o.created_at DESC LIMIT 5
      `).all()
    };
    
    res.json(stats);
  });

  // Admin Actions - User Management
  app.get('/api/admin/users', authenticate, (req: any, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    const users = db.prepare('SELECT id, name, email, role, created_at FROM users').all();
    res.json(users);
  });

  app.put('/api/admin/users/:id', authenticate, (req: any, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    const { name, email, role } = req.body;
    db.prepare('UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?').run(name, email, role, req.params.id);
    res.json({ success: true });
  });

  app.delete('/api/admin/users/:id', authenticate, (req: any, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });

  // Admin Actions - Order Management
  app.put('/api/admin/orders/:id', authenticate, (req: any, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    const { title, description, price, status, page_count, price_per_page, due_date } = req.body;
    db.prepare('UPDATE orders SET title = ?, description = ?, price = ?, status = ?, page_count = ?, price_per_page = ?, due_date = ? WHERE id = ?')
      .run(title, description, price, status, page_count, price_per_page, due_date || null, req.params.id);
    
    db.prepare('INSERT INTO status_updates (order_id, status, message) VALUES (?, ?, ?)')
      .run(req.params.id, status, 'Order updated by Admin');
    
    res.json({ success: true });
  });

  app.delete('/api/admin/orders/:id', authenticate, (req: any, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    db.prepare('DELETE FROM status_updates WHERE order_id = ?').run(req.params.id);
    db.prepare('DELETE FROM orders WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });

  app.post('/api/admin/assign', authenticate, (req: any, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    const { order_id, writer_id, delivery_id } = req.body;
    
    db.prepare("UPDATE orders SET writer_id = ?, delivery_id = ?, status = 'assigned' WHERE id = ?").run(writer_id, delivery_id, order_id);
    db.prepare('INSERT INTO status_updates (order_id, status, message) VALUES (?, ?, ?)').run(order_id, 'assigned', 'Writer and Delivery Agent assigned');
    
    // Notify Student
    const order = db.prepare('SELECT student_id, title FROM orders WHERE id = ?').get(order_id) as any;
    db.prepare('INSERT INTO notifications (user_id, message) VALUES (?, ?)').run(order.student_id, `Your order #${order_id} "${order.title}" has been assigned to a writer.`);

    // Notify Writer & Delivery
    db.prepare('INSERT INTO notifications (user_id, message) VALUES (?, ?)').run(writer_id, `You have been assigned a new writing task: #${order_id}`);
    db.prepare('INSERT INTO notifications (user_id, message) VALUES (?, ?)').run(delivery_id, `New delivery assigned: #${order_id}`);

    res.json({ success: true });
  });

  // Role Specific Updates
  app.post('/api/orders/:id/status', authenticate, (req: any, res) => {
    const { status, message } = req.body;
    const order_id = req.params.id;

    // Basic validation based on role could be added here
    db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, order_id);
    db.prepare('INSERT INTO status_updates (order_id, status, message) VALUES (?, ?, ?)').run(order_id, status, message);
    
    // Notify Student
    const order = db.prepare('SELECT student_id, title FROM orders WHERE id = ?').get(order_id) as any;
    db.prepare('INSERT INTO notifications (user_id, message) VALUES (?, ?)').run(order.student_id, `Update on order #${order_id}: ${message}`);

    res.json({ success: true });
  });

  app.get('/api/users/role/:role', authenticate, (req: any, res) => {
    const users = db.prepare('SELECT id, name FROM users WHERE role = ?').all(req.params.role);
    res.json(users);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve('dist/index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
