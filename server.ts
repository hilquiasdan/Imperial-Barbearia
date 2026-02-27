import express from "express";
import { createServer as createViteServer, loadEnv } from "vite";
import path from "path";

const app = express();
const PORT = 3000;

// Load environment variables manually
const env = loadEnv(process.env.NODE_ENV || 'development', process.cwd(), '');
const GEMINI_API_KEY = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY;

app.use(express.json());

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
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
