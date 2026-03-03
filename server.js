import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { fileURLToPath } from 'url';
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
      // admin / Imperial#Admin@2024
      await db.run('INSERT INTO users (id, username, password, name, role, barberId) VALUES (?, ?, ?, ?, ?, ?)', '0', 'admin', bcrypt.hashSync('Imperial#Admin@2024', 10), 'Administrador', 'owner', null);
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
  } catch (error) {
    console.error("Erro durante a semeadura do banco de dados:", error);
    // Don't crash the server if seeding fails
  }
};

async function startServer() {
  console.log(`Iniciando servidor em modo: ${process.env.NODE_ENV || 'development'}...`);
  const db = await initDb();
  await seedDb(db);

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
      const user = await db.get('SELECT * FROM users WHERE username = ?', username);

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

  app.get("/api/appointments", authenticate, async (req, res) => {
    const appointments = await db.all('SELECT * FROM appointments ORDER BY date DESC');
    res.json(appointments);
  });

  app.post("/api/appointments", async (req, res) => {
    try {
      const { id, clientName, clientPhone, serviceId, barberId, date, status, price } = req.body;
      console.log(`Recebendo agendamento: ${clientName} para ${date}`);
      await db.run('INSERT INTO appointments (id, clientName, clientPhone, serviceId, barberId, date, status, price) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', id, clientName, clientPhone, serviceId, barberId, date, status, price);
      res.status(201).json({ id });
    } catch (error) {
      console.error("Erro ao salvar agendamento:", error);
      res.status(500).json({ error: error.message || "Erro ao salvar agendamento" });
    }
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
    try {
      const { id } = req.params;
      const { status } = req.body;
      console.log(`Atualizando status do agendamento ${id} para ${status}`);
      await db.run('UPDATE appointments SET status = ? WHERE id = ?', status, id);
      res.json({ success: true });
    } catch (error) {
      console.error("Erro ao atualizar agendamento:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/appointments/:id", authenticate, async (req, res) => {
    try {
      const { id } = req.params;
      console.log(`Deletando agendamento: ${id}`);
      await db.run('DELETE FROM appointments WHERE id = ?', id);
      res.json({ success: true });
    } catch (error) {
      console.error("Erro ao deletar agendamento:", error);
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
    const isMySQL = process.env.DB_HOST && process.env.DB_USER;
    const dateFunc = isMySQL ? "DATE_FORMAT(date, '%Y-%m')" : "strftime('%Y-%m', date)";
    
    const stats = await db.all(`
      SELECT 
        ${dateFunc} as month,
        COUNT(*) as totalCuts,
        SUM(price) as totalRevenue
      FROM appointments
      WHERE status = 'confirmed'
      GROUP BY month
      ORDER BY month DESC
    `);
    res.json(stats);
  });

  app.get("/api/diag", async (req, res) => {
    try {
      const dbInfo = {
        type: process.env.DB_HOST ? 'MySQL' : 'SQLite',
        host: process.env.DB_HOST || 'local',
        database: process.env.DB_NAME || 'imperial.db'
      };
      
      const counts = {
        users: (await db.get("SELECT COUNT(*) as count FROM users")).count,
        barbers: (await db.get("SELECT COUNT(*) as count FROM barbers")).count,
        services: (await db.get("SELECT COUNT(*) as count FROM services")).count,
        appointments: (await db.get("SELECT COUNT(*) as count FROM appointments")).count
      };

      res.json({
        status: "ok",
        time: new Date().toISOString(),
        db: dbInfo,
        counts: counts,
        env: process.env.NODE_ENV || 'development'
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
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

  app.get("/api/debug/reset-db", async (req, res) => {
    try {
      console.log("Solicitação de reset de banco de dados recebida...");
      
      // Clear tables
      await db.exec("DELETE FROM appointments");
      await db.exec("DELETE FROM users");
      await db.exec("DELETE FROM services");
      await db.exec("DELETE FROM barbers");
      
      // Re-seed
      await seedDb(db);
      
      res.json({ message: "Banco de dados resetado e semeado com sucesso!" });
    } catch (error) {
      console.error("Erro ao resetar banco:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Serve static files from the 'dist' directory
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

  app.listen(PORT, "0.0.0.0", () => {
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
