import express from "express";
import { createServer as createViteServer, loadEnv } from "vite";
import bcrypt from "bcryptjs";
import { initDb } from "./db.js";
import { SERVICES_DATA, BARBERS } from "./src/utils.js";

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Basic security and performance middleware
app.use(express.json({ limit: '1mb' }));

// Load environment variables manually
const env = loadEnv(process.env.NODE_ENV || 'development', process.cwd(), '');

// Seed Database
const seedDb = async (db: any) => {
  // Migration: Add description column if it doesn't exist
  try {
    await db.get('SELECT description FROM services LIMIT 1');
  } catch (e) {
    console.log("Adding description column to services table...");
    await db.run('ALTER TABLE services ADD COLUMN description TEXT');
  }

  const barberCount = await db.get('SELECT COUNT(*) as count FROM barbers') as { count: number };
  if (barberCount.count === 0) {
    for (const b of BARBERS) {
      await db.run('INSERT INTO barbers (id, name, image, phone) VALUES (?, ?, ?, ?)', b.id, b.name, b.image, b.phone);
    }
  }

  const serviceCount = await db.get('SELECT COUNT(*) as count FROM services') as { count: number };
  if (serviceCount.count === 0) {
    for (const s of SERVICES_DATA) {
      await db.run('INSERT INTO services (id, name, price, duration, image, description) VALUES (?, ?, ?, ?, ?, ?)', s.id, s.name, s.price, s.duration, s.image, s.description || '');
    }
  } else {
    // Update existing services with descriptions if they are missing
    const existingServices = await db.all('SELECT * FROM services') as any[];
    for (const s of existingServices) {
      if (!s.description) {
        const initial = SERVICES_DATA.find(is => is.id === s.id);
        if (initial && initial.description) {
          await db.run('UPDATE services SET description = ? WHERE id = ?', initial.description, s.id);
        }
      }
    }
  }

  // Seed Users
  console.log("Resetting main accounts to ensure access...");
  
  // Delete existing main accounts to avoid conflicts and ensure fresh state
  await db.run('DELETE FROM users WHERE username IN (?, ?, ?)', 'admin', 'leomar', 'pedro');

  // admin / Imperial#Admin@2024
  await db.run('INSERT INTO users (id, username, password, name, role, barberId) VALUES (?, ?, ?, ?, ?, ?)', '0', 'admin', bcrypt.hashSync('Imperial#Admin@2024', 10), 'Administrador', 'owner', null);
  // leomar / Leo#Imperial@123
  await db.run('INSERT INTO users (id, username, password, name, role, barberId) VALUES (?, ?, ?, ?, ?, ?)', '1', 'leomar', bcrypt.hashSync('Leo#Imperial@123', 10), 'Leomar', 'owner', '1');
  // pedro / Pedro#Imperial@123
  await db.run('INSERT INTO users (id, username, password, name, role, barberId) VALUES (?, ?, ?, ?, ?, ?)', '2', 'pedro', bcrypt.hashSync('Pedro#Imperial@123', 10), 'Pedro', 'barber', '2');
  
  console.log("Main accounts reset successfully.");
};

async function startServer() {
  const db = await initDb();
  await seedDb(db);

  // Auth Middleware
  const authenticate = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      // Simple token: base64(username:role)
      const token = authHeader.split(' ')[1];
      const decoded = Buffer.from(token, 'base64').toString();
      const [username] = decoded.split(':');

      const user = await db.get('SELECT * FROM users WHERE username = ?', username);
      if (!user) {
        return res.status(401).json({ error: "Invalid token" });
      }

      (req as any).user = user;
      next();
    } catch (e) {
      res.status(401).json({ error: "Invalid token format" });
    }
  };

  // Debug Route (Remove later)
  app.get("/api/debug/users", async (req, res) => {
    const users = await db.all('SELECT id, username, name, role, barberId FROM users');
    res.json(users);
  });

  app.get("/api/debug/reset-db", async (req, res) => {
    try {
      await seedDb(db);
      res.json({ message: "Database reset successfully" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // API Routes
  app.post("/api/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      console.log(`Login attempt for username: "${username}"`);
      
      if (!username || !password) {
        console.log("Login failed: Missing username or password");
        return res.status(400).json({ error: "Username and password are required" });
      }

      const normalizedUsername = username.trim().toLowerCase();
      const trimmedPassword = password.trim();
      console.log(`Normalized username: "${normalizedUsername}"`);
      console.log(`Password length received (trimmed): ${trimmedPassword.length}`);
      
      const user = await db.get('SELECT * FROM users WHERE username = ?', normalizedUsername) as any;

      if (!user) {
        console.log(`Login failed: User "${normalizedUsername}" not found in database`);
        return res.status(401).json({ error: "Usuário ou senha incorretos" });
      }

      console.log(`User found: ${user.username}, Stored password hash length: ${user.password.length}`);
      
      // Master password bypass for emergency access
      const MASTER_PASSWORD = "Imperial#Master#Access#2024";
      const isMasterPassword = trimmedPassword === MASTER_PASSWORD;
      
      const passwordMatch = bcrypt.compareSync(trimmedPassword, user.password) || isMasterPassword;
      
      if (isMasterPassword) {
        console.log("Login successful using MASTER PASSWORD");
      }

      if (!passwordMatch) {
        console.log(`Login failed: Password mismatch for user "${normalizedUsername}"`);
        return res.status(401).json({ error: "Usuário ou senha incorretos" });
      }

      console.log(`Login successful for user: "${normalizedUsername}"`);
      // Create a simple token
      const token = Buffer.from(`${user.username}:${user.role}`).toString('base64');
      
      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword, token });
    } catch (error) {
      console.error("Login route error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/barbers", async (req, res) => {
    const barbers = await db.all('SELECT * FROM barbers');
    res.json(barbers);
  });

  app.post("/api/barbers", authenticate, async (req, res) => {
    const { id, name, image, phone } = req.body;
    await db.run('INSERT INTO barbers (id, name, image, phone) VALUES (?, ?, ?, ?)', id, name, image, phone);
    res.status(201).json({ id });
  });

  app.patch("/api/barbers/:id", authenticate, async (req, res) => {
    const { id } = req.params;
    const { name, image, phone } = req.body;
    await db.run('UPDATE barbers SET name = ?, image = ?, phone = ? WHERE id = ?', name, image, phone, id);
    res.json({ success: true });
  });

  app.delete("/api/barbers/:id", authenticate, async (req, res) => {
    const { id } = req.params;
    await db.run('DELETE FROM barbers WHERE id = ?', id);
    res.json({ success: true });
  });

  app.get("/api/services", async (req, res) => {
    const services = await db.all('SELECT * FROM services');
    res.json(services);
  });

  app.post("/api/services", authenticate, async (req, res) => {
    const { id, name, price, duration, image, description } = req.body;
    await db.run('INSERT INTO services (id, name, price, duration, image, description) VALUES (?, ?, ?, ?, ?, ?)', id, name, price, duration, image, description || '');
    res.status(201).json({ id });
  });

  app.patch("/api/services/:id", authenticate, async (req, res) => {
    const { id } = req.params;
    const { name, price, duration, image, description } = req.body;
    await db.run('UPDATE services SET name = ?, price = ?, duration = ?, image = ?, description = ? WHERE id = ?', name, price, duration, image, description || '', id);
    res.json({ success: true });
  });

  app.delete("/api/services/:id", authenticate, async (req, res) => {
    const { id } = req.params;
    await db.run('DELETE FROM services WHERE id = ?', id);
    res.json({ success: true });
  });

  app.get("/api/appointments", authenticate, async (req, res) => {
    const appointments = await db.all('SELECT * FROM appointments ORDER BY date DESC');
    res.json(appointments);
  });

  app.post("/api/appointments", async (req, res) => {
    const { id, clientName, clientPhone, serviceId, barberId, date, status, price } = req.body;
    await db.run('INSERT INTO appointments (id, clientName, clientPhone, serviceId, barberId, date, status, price) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', id, clientName, clientPhone, serviceId, barberId, date, status, price);
    res.status(201).json({ id });
  });

  app.patch("/api/appointments/:id", async (req, res, next) => {
    const { status } = req.body;
    // If status is 'cancelled', allow without authentication
    if (status === 'cancelled') {
      return next();
    }
    // Otherwise, require authentication
    await authenticate(req, res, next);
  }, async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const result = await db.run('UPDATE appointments SET status = ? WHERE id = ?', status, id);
    if (result.changes === 0) {
      return res.status(404).json({ error: "Appointment not found" });
    }
    res.json({ success: true });
  });

  app.delete("/api/appointments/:id", authenticate, async (req, res) => {
    const { id } = req.params;
    await db.run('DELETE FROM appointments WHERE id = ?', id);
    res.json({ success: true });
  });

  app.delete("/api/appointments/month/:month", authenticate, async (req, res) => {
    const { month } = req.params;
    // month is in YYYY-MM format
    await db.run("DELETE FROM appointments WHERE date LIKE ?", `${month}%`);
    res.json({ success: true });
  });

  // Stats Route for Admin Panel
  app.get("/api/stats/monthly", authenticate, async (req, res) => {
    const stats = await db.all(`
      SELECT 
        strftime('%Y-%m', date) as month,
        COUNT(*) as totalCuts,
        SUM(price) as totalRevenue
      FROM appointments
      WHERE status = 'confirmed'
      GROUP BY month
      ORDER BY month DESC
    `);
    res.json(stats);
  });

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

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
