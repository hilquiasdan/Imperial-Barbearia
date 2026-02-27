import express from "express";
import { createServer as createViteServer, loadEnv } from "vite";
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
  const barberCount = db.prepare('SELECT COUNT(*) as count FROM barbers').get() as { count: number };
  if (barberCount.count === 0) {
    const insertBarber = db.prepare('INSERT INTO barbers (id, name, image, phone) VALUES (?, ?, ?, ?)');
    BARBERS.forEach(b => insertBarber.run(b.id, b.name, b.image, b.phone));
  }

  const serviceCount = db.prepare('SELECT COUNT(*) as count FROM services').get() as { count: number };
  if (serviceCount.count === 0) {
    const insertService = db.prepare('INSERT INTO services (id, name, price, duration, image) VALUES (?, ?, ?, ?, ?)');
    SERVICES_DATA.forEach(s => insertService.run(s.id, s.name, s.price, s.duration, s.image));
  }
};

seedDb();

// API Routes
app.get("/api/barbers", (req, res) => {
  const barbers = db.prepare('SELECT * FROM barbers').all();
  res.json(barbers);
});

app.post("/api/barbers", (req, res) => {
  const { id, name, image, phone } = req.body;
  const insert = db.prepare('INSERT INTO barbers (id, name, image, phone) VALUES (?, ?, ?, ?)');
  insert.run(id, name, image, phone);
  res.status(201).json({ id });
});

app.patch("/api/barbers/:id", (req, res) => {
  const { id } = req.params;
  const { name, image, phone } = req.body;
  db.prepare('UPDATE barbers SET name = ?, image = ?, phone = ? WHERE id = ?').run(name, image, phone, id);
  res.json({ success: true });
});

app.delete("/api/barbers/:id", (req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM barbers WHERE id = ?').run(id);
  res.json({ success: true });
});

app.get("/api/services", (req, res) => {
  const services = db.prepare('SELECT * FROM services').all();
  res.json(services);
});

app.post("/api/services", (req, res) => {
  const { id, name, price, duration, image } = req.body;
  const insert = db.prepare('INSERT INTO services (id, name, price, duration, image) VALUES (?, ?, ?, ?, ?)');
  insert.run(id, name, price, duration, image);
  res.status(201).json({ id });
});

app.patch("/api/services/:id", (req, res) => {
  const { id } = req.params;
  const { name, price, duration, image } = req.body;
  db.prepare('UPDATE services SET name = ?, price = ?, duration = ?, image = ? WHERE id = ?').run(name, price, duration, image, id);
  res.json({ success: true });
});

app.delete("/api/services/:id", (req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM services WHERE id = ?').run(id);
  res.json({ success: true });
});

app.get("/api/appointments", (req, res) => {
  const appointments = db.prepare('SELECT * FROM appointments ORDER BY date DESC').all();
  res.json(appointments);
});

app.post("/api/appointments", (req, res) => {
  const { id, clientName, clientPhone, serviceId, barberId, date, status, price } = req.body;
  const insert = db.prepare('INSERT INTO appointments (id, clientName, clientPhone, serviceId, barberId, date, status, price) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  insert.run(id, clientName, clientPhone, serviceId, barberId, date, status, price);
  res.status(201).json({ id });
});

app.patch("/api/appointments/:id", (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  db.prepare('UPDATE appointments SET status = ? WHERE id = ?').run(status, id);
  res.json({ success: true });
});

// Stats Route for Admin Panel
app.get("/api/stats/monthly", (req, res) => {
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
