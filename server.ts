import express from "express";
import { createServer as createViteServer, loadEnv } from "vite";
import bcrypt from "bcryptjs";
import db from "./db.js";
import { SERVICES_DATA, BARBERS } from "./src/utils.js";

const app = express();
const PORT = 3000;

// Basic security and performance middleware
app.use(express.json({ limit: '1mb' }));

// Load environment variables manually
const env = loadEnv(process.env.NODE_ENV || 'development', process.cwd(), '');

// Seed Database
const seedDb = () => {
  // Migration: Add description column if it doesn't exist
  try {
    db.prepare('SELECT description FROM services LIMIT 1').get();
  } catch (e) {
    console.log("Adding description column to services table...");
    db.prepare('ALTER TABLE services ADD COLUMN description TEXT').run();
  }

  const barberCount = db.prepare('SELECT COUNT(*) as count FROM barbers').get() as { count: number };
  if (barberCount.count === 0) {
    const insertBarber = db.prepare('INSERT INTO barbers (id, name, image, phone) VALUES (?, ?, ?, ?)');
    BARBERS.forEach(b => insertBarber.run(b.id, b.name, b.image, b.phone));
  }

  const serviceCount = db.prepare('SELECT COUNT(*) as count FROM services').get() as { count: number };
  if (serviceCount.count === 0) {
    const insertService = db.prepare('INSERT INTO services (id, name, price, duration, image, description) VALUES (?, ?, ?, ?, ?, ?)');
    SERVICES_DATA.forEach(s => insertService.run(s.id, s.name, s.price, s.duration, s.image, s.description || ''));
  } else {
    // Update existing services with descriptions if they are missing
    const existingServices = db.prepare('SELECT * FROM services').all() as any[];
    existingServices.forEach(s => {
      if (!s.description) {
        const initial = SERVICES_DATA.find(is => is.id === s.id);
        if (initial && initial.description) {
          db.prepare('UPDATE services SET description = ? WHERE id = ?').run(initial.description, s.id);
        }
      }
    });
  }

  // Seed Users
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCount.count === 0) {
    const insertUser = db.prepare('INSERT INTO users (id, username, password, name, role, barberId) VALUES (?, ?, ?, ?, ?, ?)');
    
    // admin / Imperial#Admin@2024
    insertUser.run('0', 'admin', bcrypt.hashSync('Imperial#Admin@2024', 10), 'Administrador', 'owner', null);
    // leomar / Leo#Imperial@123
    insertUser.run('1', 'leomar', bcrypt.hashSync('Leo#Imperial@123', 10), 'Leomar', 'owner', '1');
    // pedro / Pedro#Imperial@123
    insertUser.run('2', 'pedro', bcrypt.hashSync('Pedro#Imperial@123', 10), 'Pedro', 'barber', '2');
    
    console.log("Users seeded successfully.");
  }
};

seedDb();

// Auth Middleware
const authenticate = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    // Simple token: base64(username:role)
    const token = authHeader.split(' ')[1];
    const decoded = Buffer.from(token, 'base64').toString();
    const [username] = decoded.split(':');

    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (!user) {
      return res.status(401).json({ error: "Invalid token" });
    }

    (req as any).user = user;
    next();
  } catch (e) {
    res.status(401).json({ error: "Invalid token format" });
  }
};

// API Routes
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username.trim().toLowerCase()) as any;

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: "Usuário ou senha incorretos" });
  }

  // Create a simple token
  const token = Buffer.from(`${user.username}:${user.role}`).toString('base64');
  
  const { password: _, ...userWithoutPassword } = user;
  res.json({ user: userWithoutPassword, token });
});

app.get("/api/barbers", (req, res) => {
  const barbers = db.prepare('SELECT * FROM barbers').all();
  res.json(barbers);
});

app.post("/api/barbers", authenticate, (req, res) => {
  const { id, name, image, phone } = req.body;
  const insert = db.prepare('INSERT INTO barbers (id, name, image, phone) VALUES (?, ?, ?, ?)');
  insert.run(id, name, image, phone);
  res.status(201).json({ id });
});

app.patch("/api/barbers/:id", authenticate, (req, res) => {
  const { id } = req.params;
  const { name, image, phone } = req.body;
  db.prepare('UPDATE barbers SET name = ?, image = ?, phone = ? WHERE id = ?').run(name, image, phone, id);
  res.json({ success: true });
});

app.delete("/api/barbers/:id", authenticate, (req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM barbers WHERE id = ?').run(id);
  res.json({ success: true });
});

app.get("/api/services", (req, res) => {
  const services = db.prepare('SELECT * FROM services').all();
  res.json(services);
});

app.post("/api/services", authenticate, (req, res) => {
  const { id, name, price, duration, image, description } = req.body;
  const insert = db.prepare('INSERT INTO services (id, name, price, duration, image, description) VALUES (?, ?, ?, ?, ?, ?)');
  insert.run(id, name, price, duration, image, description || '');
  res.status(201).json({ id });
});

app.patch("/api/services/:id", authenticate, (req, res) => {
  const { id } = req.params;
  const { name, price, duration, image, description } = req.body;
  db.prepare('UPDATE services SET name = ?, price = ?, duration = ?, image = ?, description = ? WHERE id = ?').run(name, price, duration, image, description || '', id);
  res.json({ success: true });
});

app.delete("/api/services/:id", authenticate, (req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM services WHERE id = ?').run(id);
  res.json({ success: true });
});

app.get("/api/appointments", authenticate, (req, res) => {
  const appointments = db.prepare('SELECT * FROM appointments ORDER BY date DESC').all();
  res.json(appointments);
});

app.post("/api/appointments", (req, res) => {
  const { id, clientName, clientPhone, serviceId, barberId, date, status, price } = req.body;
  const insert = db.prepare('INSERT INTO appointments (id, clientName, clientPhone, serviceId, barberId, date, status, price) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  insert.run(id, clientName, clientPhone, serviceId, barberId, date, status, price);
  res.status(201).json({ id });
});

app.patch("/api/appointments/:id", (req, res, next) => {
  const { status } = req.body;
  // If status is 'cancelled', allow without authentication
  if (status === 'cancelled') {
    return next();
  }
  // Otherwise, require authentication
  authenticate(req, res, next);
}, (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const result = db.prepare('UPDATE appointments SET status = ? WHERE id = ?').run(status, id);
  if (result.changes === 0) {
    return res.status(404).json({ error: "Appointment not found" });
  }
  res.json({ success: true });
});

app.delete("/api/appointments/:id", authenticate, (req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM appointments WHERE id = ?').run(id);
  res.json({ success: true });
});

app.delete("/api/appointments/month/:month", authenticate, (req, res) => {
  const { month } = req.params;
  // month is in YYYY-MM format
  db.prepare("DELETE FROM appointments WHERE date LIKE ?").run(`${month}%`);
  res.json({ success: true });
});

// Stats Route for Admin Panel
app.get("/api/stats/monthly", authenticate, (req, res) => {
  const stats = db.prepare(`
    SELECT 
      strftime('%Y-%m', date) as month,
      COUNT(*) as totalCuts,
      SUM(price) as totalRevenue
    FROM appointments
    WHERE status = 'confirmed'
    GROUP BY month
    ORDER BY month DESC
  `).all();
  res.json(stats);
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
    app.get("*", (req, res) => {
      res.sendFile("dist/index.html", { root: "." });
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
  });
}

startServer();
