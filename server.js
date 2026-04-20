import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { fileURLToPath } from 'url';
import { createServer } from "http";
import { Server } from "socket.io";
import { initDb, dbPath } from "./db.js";
import { SERVICES_DATA, BARBERS } from "./src/backendUtils.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Basic security and performance middleware
app.use(cors());
app.use(express.json({ limit: '1mb' }));

  // Seed Database
const seedDb = async (db) => {
  try {
    console.log("Iniciando semeadura do banco de dados...");
    
    // Migration: Add description column if it doesn't exist
    try {
      await db.get('SELECT description FROM services LIMIT 1');
    } catch (e) {
      console.log("Adicionando coluna 'description' à tabela de serviços...");
      await db.run('ALTER TABLE services ADD COLUMN description TEXT');
    }

    // Migration: Add attended column if it doesn't exist
    try {
      await db.get('SELECT attended FROM appointments LIMIT 1');
    } catch (e) {
      console.log("Adicionando coluna 'attended' à tabela de agendamentos...");
      const isMySQL = process.env.DB_HOST && process.env.DB_USER;
      if (isMySQL) {
        await db.run('ALTER TABLE appointments ADD COLUMN attended BOOLEAN DEFAULT FALSE');
      } else {
        await db.run('ALTER TABLE appointments ADD COLUMN attended INTEGER DEFAULT 0');
      }
    }

    const barberCount = await db.get('SELECT COUNT(*) as count FROM barbers');
    console.log(`- Barbeiros encontrados: ${barberCount?.count || 0}`);
    if (barberCount && barberCount.count === 0) {
      console.log("Inserindo barbeiros iniciais...");
      for (const b of BARBERS) {
        await db.run('INSERT INTO barbers (id, name, image, phone) VALUES (?, ?, ?, ?)', b.id, b.name, b.image, b.phone);
      }
    }

    const serviceCount = await db.get('SELECT COUNT(*) as count FROM services');
    console.log(`- Serviços encontrados: ${serviceCount?.count || 0}`);
    if (serviceCount && serviceCount.count === 0) {
      console.log("Inserindo serviços iniciais...");
      for (const s of SERVICES_DATA) {
        await db.run('INSERT INTO services (id, name, price, duration, image, description) VALUES (?, ?, ?, ?, ?, ?)', s.id, s.name, s.price, s.duration, s.image, s.description || '');
      }
    } else if (serviceCount) {
      // Update existing services with descriptions if they are missing
      const existingServices = await db.all('SELECT * FROM services');
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
    const users = await db.all('SELECT * FROM users');
    console.log(`- Usuários encontrados: ${users.length}`);
    
    // Check if admin exists, if not create it
    const adminUser = users.find(u => u.username === 'admin');
    if (!adminUser) {
      console.log("Inserindo usuário administrador padrão...");
      // admin / Matheus#Admin@2024
      await db.run('INSERT INTO users (id, username, password, name, role, barberId) VALUES (?, ?, ?, ?, ?, ?)', '0', 'admin', bcrypt.hashSync('Matheus#Admin@2024', 10), 'Administrador', 'owner', null);
    }

    // Add Leomar (Owner/Admin)
    const leomarUser = users.find(u => u.username === 'leomar');
    if (!leomarUser) {
      console.log("Inserindo usuário Leomar (Admin)...");
      await db.run('INSERT INTO users (id, username, password, name, role, barberId) VALUES (?, ?, ?, ?, ?, ?)', '1', 'leomar', bcrypt.hashSync('Leomar@Matheus2024', 10), 'Leomar', 'owner', '1');
    }

    // Add Pedro (Barber)
    const pedroUser = users.find(u => u.username === 'pedro');
    if (!pedroUser) {
      console.log("Inserindo usuário Pedro (Barbeiro)...");
      await db.run('INSERT INTO users (id, username, password, name, role, barberId) VALUES (?, ?, ?, ?, ?, ?)', '2', 'pedro', bcrypt.hashSync('Pedro@Matheus2024', 10), 'Pedro', 'barber', '2');
    }

    // Migration: Ensure all passwords are hashed
    for (const user of users) {
      if (user.password && !user.password.startsWith('$2a$') && !user.password.startsWith('$2b$')) {
        console.log(`Hasheando senha em texto puro para o usuário: ${user.username}`);
        const hashedPassword = bcrypt.hashSync(user.password, 10);
        await db.run('UPDATE users SET password = ? WHERE id = ?', hashedPassword, user.id);
      }
    }
    console.log("Semeadura concluída com sucesso.");

    // Manual seed for missing appointments as requested by user
    const manualApps = [
      { id: 'manual_wilams', clientName: 'Wilams', clientPhone: '5581900000000', serviceId: '1', barberId: '1', date: '2026-03-20T14:00:00.000Z', status: 'confirmed', price: 30 },
      { id: 'manual_junior', clientName: 'Junior', clientPhone: '5581900000000', serviceId: '1', barberId: '1', date: '2026-03-20T15:00:00.000Z', status: 'confirmed', price: 30 },
      { id: 'manual_erion', clientName: 'Erion', clientPhone: '5581900000000', serviceId: '1', barberId: '1', date: '2026-03-20T16:00:00.000Z', status: 'confirmed', price: 30 },
    ];

    for (const app of manualApps) {
      const exists = await db.get('SELECT id FROM appointments WHERE clientName = ? AND date = ?', app.clientName, app.date);
      if (!exists) {
        console.log(`Inserindo agendamento manual para: ${app.clientName}`);
        await db.run('INSERT INTO appointments (id, clientName, clientPhone, serviceId, barberId, date, status, price) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          app.id, app.clientName, app.clientPhone, app.serviceId, app.barberId, app.date, app.status, app.price);
      }
    }
  } catch (error) {
    console.error("Erro durante a semeadura do banco de dados:", error);
    // Don't crash the server if seeding fails
  }
};

async function startServer() {
  console.log(`Iniciando servidor em modo: ${process.env.NODE_ENV || 'development'}...`);
  const db = await initDb();
  await seedDb(db);

  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on("connection", (socket) => {
    console.log("Cliente conectado via WebSocket:", socket.id);
    
    socket.on("join_admin", (data) => {
      console.log(`Admin/Barbeiro ${data.username} entrou na sala de notificações`);
      socket.join("admin_room");
    });

    socket.on("disconnect", () => {
      console.log("Cliente desconectado:", socket.id);
    });
  });

  // Auth Middleware
  const authenticate = async (req, res, next) => {
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

      req.user = user;
      next();
    } catch (e) {
      res.status(401).json({ error: "Invalid token format" });
    }
  };

  // API Routes
  app.post("/api/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await db.get('SELECT * FROM users WHERE LOWER(username) = LOWER(?)', username);

      if (!user || !bcrypt.compareSync(password, user.password)) {
        return res.status(401).json({ error: "Usuário ou senha incorretos" });
      }

      // Create a simple token
      const token = Buffer.from(`${user.username}:${user.role}`).toString('base64');
      
      const { password: userPassword, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword, token });
    } catch (error) {
      console.error("Erro no login:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.get("/api/barbers", async (req, res) => {
    try {
      const barbers = await db.all('SELECT * FROM barbers');
      res.json(barbers);
    } catch (error) {
      console.error("Erro ao buscar barbeiros:", error);
      res.status(500).json({ error: "Erro ao buscar barbeiros" });
    }
  });

  app.post("/api/barbers", authenticate, async (req, res) => {
    try {
      const { id, name, image, phone } = req.body;
      console.log(`Inserindo barbeiro: ${name} (${id})`);
      await db.run('INSERT INTO barbers (id, name, image, phone) VALUES (?, ?, ?, ?)', id, name, image, phone);
      console.log(`Barbeiro ${id} inserido com sucesso.`);
      res.status(201).json({ id });
    } catch (error) {
      console.error("Erro ao inserir barbeiro:", error);
      res.status(500).json({ error: error.message || "Erro ao inserir barbeiro" });
    }
  });

  app.patch("/api/barbers/:id", authenticate, async (req, res) => {
    try {
      const { id } = req.params;
      const { name, image, phone } = req.body;
      console.log(`Atualizando barbeiro: ${id}`);
      await db.run('UPDATE barbers SET name = ?, image = ?, phone = ? WHERE id = ?', name, image, phone, id);
      res.json({ success: true });
    } catch (error) {
      console.error("Erro ao atualizar barbeiro:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/barbers/:id", authenticate, async (req, res) => {
    try {
      const { id } = req.params;
      console.log(`Deletando barbeiro: ${id}`);
      await db.run('DELETE FROM barbers WHERE id = ?', id);
      res.json({ success: true });
    } catch (error) {
      console.error("Erro ao deletar barbeiro:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/services", async (req, res) => {
    try {
      const services = await db.all('SELECT * FROM services');
      res.json(services);
    } catch (error) {
      console.error("Erro ao buscar serviços:", error);
      res.status(500).json({ error: "Erro ao buscar serviços" });
    }
  });

  app.post("/api/services", authenticate, async (req, res) => {
    try {
      const { id, name, price, duration, image, description } = req.body;
      console.log(`Inserindo serviço: ${name} (${id})`);
      await db.run('INSERT INTO services (id, name, price, duration, image, description) VALUES (?, ?, ?, ?, ?, ?)', id, name, price, duration, image, description || '');
      console.log(`Serviço ${id} inserido com sucesso.`);
      res.status(201).json({ id });
    } catch (error) {
      console.error("Erro ao inserir serviço:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/services/:id", authenticate, async (req, res) => {
    try {
      const { id } = req.params;
      const { name, price, duration, image, description } = req.body;
      console.log(`Atualizando serviço: ${id}`);
      await db.run('UPDATE services SET name = ?, price = ?, duration = ?, image = ?, description = ? WHERE id = ?', name, price, duration, image, description || '', id);
      res.json({ success: true });
    } catch (error) {
      console.error("Erro ao atualizar serviço:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/services/:id", authenticate, async (req, res) => {
    try {
      const { id } = req.params;
      console.log(`Deletando serviço: ${id}`);
      await db.run('DELETE FROM services WHERE id = ?', id);
      res.json({ success: true });
    } catch (error) {
      console.error("Erro ao deletar serviço:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/appointments", async (req, res) => {
    try {
      const appointments = await db.all('SELECT * FROM appointments ORDER BY date DESC');
      
      const authHeader = req.headers.authorization;
      let isAuthenticated = false;
      if (authHeader) {
        try {
          const token = authHeader.split(' ')[1];
          const decoded = Buffer.from(token, 'base64').toString();
          const [username] = decoded.split(':');
          const user = await db.get('SELECT * FROM users WHERE username = ?', username);
          if (user) isAuthenticated = true;
        } catch (e) {}
      }

      if (isAuthenticated) {
        res.json(appointments);
      } else {
        const publicAppointments = appointments.map(app => ({
          ...app,
          clientName: 'Cliente'
        }));
        res.json(publicAppointments);
      }
    } catch (error) {
      console.error("Erro ao buscar agendamentos:", error);
      res.status(500).json({ error: "Erro ao buscar agendamentos" });
    }
  });

  app.post("/api/appointments", async (req, res) => {
    try {
      const { id, clientName, clientPhone, serviceId, barberId, date, status, price } = req.body;
      console.log(`Recebendo agendamento: ${clientName} para ${date}`);
      await db.run('INSERT INTO appointments (id, clientName, clientPhone, serviceId, barberId, date, status, price) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', id, clientName, clientPhone, serviceId, barberId, date, status, price);
      
      // Emitir notificação para os administradores/barbeiros logados
      io.to("admin_room").emit("new_appointment", {
        id,
        clientName,
        clientPhone,
        serviceId,
        barberId,
        date,
        price
      });

      res.status(201).json({ id });
    } catch (error) {
      console.error("Erro ao salvar agendamento:", error);
      res.status(500).json({ error: error.message || "Erro ao salvar agendamento" });
    }
  });

  app.patch("/api/appointments/:id", async (req, res, next) => {
    const { status, attended } = req.body;
    // If only status is provided and it's 'cancelled', allow without authentication
    if (status === 'cancelled' && attended === undefined) {
      return next();
    }
    // Otherwise, require authentication
    await authenticate(req, res, next);
  }, async (req, res) => {
    try {
      const { id } = req.params;
      const { status, attended } = req.body;
      
      if (status !== undefined) {
        console.log(`Atualizando status do agendamento ${id} para ${status}`);
        await db.run('UPDATE appointments SET status = ? WHERE id = ?', status, id);
      }
      
      if (attended !== undefined) {
        console.log(`Atualizando status de atendimento do agendamento ${id} para ${attended}`);
        const isMySQL = process.env.DB_HOST && process.env.DB_USER;
        const val = isMySQL ? (attended ? 1 : 0) : (attended ? 1 : 0);
        await db.run('UPDATE appointments SET attended = ? WHERE id = ?', val, id);
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Erro ao atualizar agendamento:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/appointments/:id", authenticate, async (req, res) => {
    try {
      const { id } = req.params;
      console.log(`[DELETE] Tentando excluir agendamento ID: ${id}`);
      
      const result = await db.run('DELETE FROM appointments WHERE id = ?', id);
      
      if (result && result.changes > 0) {
        console.log(`[DELETE] Agendamento ${id} excluído com sucesso.`);
        res.json({ success: true });
      } else {
        console.warn(`[DELETE] Nenhum agendamento encontrado com o ID: ${id} ou nenhuma alteração feita.`);
        res.json({ success: true, message: "Agendamento não encontrado ou já excluído" });
      }
    } catch (error) {
      console.error("[DELETE] Erro crítico ao deletar agendamento:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/appointments/month/:month", authenticate, async (req, res) => {
    try {
      const { month } = req.params;
      console.log(`Deletando agendamentos do mês: ${month}`);
      // month is in YYYY-MM format
      await db.run("DELETE FROM appointments WHERE date LIKE ?", `${month}%`);
      res.json({ success: true });
    } catch (error) {
      console.error("Erro ao deletar agendamentos por mês:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Stats Route for Admin Panel
  app.get("/api/stats/monthly", authenticate, async (req, res) => {
    try {
      const isMySQL = process.env.DB_HOST && process.env.DB_USER;
      // Use substr/LEFT to be more robust with ISO strings containing 'T'
      const dateFunc = isMySQL ? "LEFT(date, 7)" : "substr(date, 1, 7)";
      
      const stats = await db.all(`
        SELECT 
          ${dateFunc} as month,
          COUNT(*) as totalCuts,
          SUM(price) as totalRevenue
        FROM appointments
        WHERE status != 'cancelled'
        GROUP BY month
        ORDER BY month DESC
      `);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching monthly stats:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Export Monthly Report CSV
  app.get("/api/reports/export/:month", authenticate, async (req, res) => {
    try {
      const { month } = req.params; // YYYY-MM
      console.log(`Gerando relatório CSV para o mês: ${month}`);
      
      const appointments = await db.all(`
        SELECT 
          a.date,
          a.clientName,
          a.clientPhone,
          s.name as serviceName,
          b.name as barberName,
          a.price,
          a.attended
        FROM appointments a
        LEFT JOIN services s ON a.serviceId = s.id
        LEFT JOIN barbers b ON a.barberId = b.id
        WHERE a.date LIKE ? AND a.status != 'cancelled'
        ORDER BY a.date ASC
      `, `${month}%`);

      if (appointments.length === 0) {
        return res.status(404).json({ error: "Nenhum dado encontrado para este mês." });
      }

      // Generate CSV
      const headers = ["Data", "Horário", "Cliente", "Telefone", "Serviço", "Barbeiro", "Valor", "Atendido"];
      const rows = appointments.map(a => {
        const d = new Date(a.date);
        const dateStr = d.toLocaleDateString('pt-BR');
        const timeStr = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        return [
          dateStr,
          timeStr,
          a.clientName,
          a.clientPhone,
          a.serviceName || 'N/A',
          a.barberName || 'N/A',
          a.price.toFixed(2),
          a.attended ? "Sim" : "Não"
        ];
      });

      const csvContent = [
        headers.join(","),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
      ].join("\n");

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=relatorio-imperial-barbearia-${month}.csv`);
      // Add BOM for Excel UTF-8 support
      res.send("\ufeff" + csvContent);
    } catch (error) {
      console.error("Erro ao exportar relatório:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/diag", async (req, res) => {
    try {
      const dbInfo = {
        type: process.env.DB_HOST ? 'MySQL' : 'SQLite',
        host: process.env.DB_HOST || 'local',
        database: process.env.DB_NAME || 'imperial.db',
        connected: !!db
      };
      
      const envVars = {
        DB_HOST: !!process.env.DB_HOST,
        DB_USER: !!process.env.DB_USER,
        DB_NAME: !!process.env.DB_NAME,
        DB_PASSWORD: !!process.env.DB_PASSWORD,
        PORT: process.env.PORT || 3000,
        NODE_ENV: process.env.NODE_ENV || 'development'
      };

      let counts = { users: 0, barbers: 0, services: 0, appointments: 0 };
      let lastAppointments = [];
      
      if (db) {
        counts = {
          users: (await db.get("SELECT COUNT(*) as count FROM users")).count,
          barbers: (await db.get("SELECT COUNT(*) as count FROM barbers")).count,
          services: (await db.get("SELECT COUNT(*) as count FROM services")).count,
          appointments: (await db.get("SELECT COUNT(*) as count FROM appointments")).count
        };
        lastAppointments = await db.all("SELECT id, clientName, date, status FROM appointments ORDER BY date DESC LIMIT 5");
      }

      res.json({
        status: "ok",
        time: new Date().toISOString(),
        db: dbInfo,
        env: envVars,
        counts: counts,
        lastAppointments: lastAppointments,
        cwd: process.cwd(),
        dir: __dirname
      });
    } catch (error) {
      res.status(500).json({ 
        error: error.message,
        stack: error.stack,
        env_check: {
          DB_HOST: !!process.env.DB_HOST,
          DB_USER: !!process.env.DB_USER
        }
      });
    }
  });

  app.get("/api/health/db", async (req, res) => {
    try {
      console.log("Verificando saúde do banco de dados...");
      const result1 = await db.get("SELECT 1 as val");
      const result2 = await db.get("SELECT DATABASE() AS db, CURRENT_USER() AS user");
      
      // Check table counts
      const barbers = await db.get("SELECT COUNT(*) as count FROM barbers");
      const services = await db.get("SELECT COUNT(*) as count FROM services");
      const users = await db.get("SELECT COUNT(*) as count FROM users");
      const appointments = await db.get("SELECT COUNT(*) as count FROM appointments");

      const health = {
        status: "ok",
        test: result1.val === 1 ? "success" : "failed",
        database: result2.db,
        user: result2.user,
        type: process.env.DB_HOST && process.env.DB_USER ? 'MySQL' : 'SQLite',
        counts: {
          barbers: barbers.count,
          services: services.count,
          users: users.count,
          appointments: appointments.count
        }
      };
      
      console.log("Saúde do banco de dados:", health);
      res.json(health);
    } catch (error) {
      console.error("Erro na saúde do banco de dados:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/debug/users", async (req, res) => {
    try {
      const users = await db.all('SELECT id, username, name, role, barberId FROM users');
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      dbType: process.env.DB_HOST && process.env.DB_USER ? 'MySQL' : 'SQLite',
      env: process.env.NODE_ENV || 'development'
    });
  });

  // Debug reset route removed for security

  // Serve static files or use Vite middleware
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite middleware carregado para desenvolvimento.");
  } else {
    const distPath = path.join(__dirname, "dist");
    console.log(`Servindo arquivos estáticos de: ${distPath}`);
    
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get("*", (req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
      } else {
        console.warn("AVISO: Pasta 'dist' não encontrada. O frontend pode não ser servido corretamente.");
        app.get("/", (req, res) => {
          res.send("Servidor Backend Imperial Barbearia está rodando. Por favor, execute 'npm run build' para servir o frontend.");
        });
      }
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Servidor rodando em produção na porta ${PORT}`);
  });
}

// Global error handlers to prevent crash on unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception thrown:', err);
});

startServer().catch(err => {
  console.error("FALHA CRÍTICA NA INICIALIZAÇÃO DO SERVIDOR:", err);
  process.exit(1);
});
