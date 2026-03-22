
import dotenv from 'dotenv';
import { initDb } from './db.js';

dotenv.config();

async function test() {
  console.log("Iniciando teste de conexão...");
  console.log("Variáveis de ambiente detectadas:");
  console.log("- DB_HOST:", process.env.DB_HOST || "Não definido");
  console.log("- DB_USER:", process.env.DB_USER || "Não definido");
  console.log("- DB_NAME:", process.env.DB_NAME || "Não definido");
  console.log("- DB_PASSWORD:", process.env.DB_PASSWORD ? "********" : "Não definido");
  console.log("- DB_PORT:", process.env.DB_PORT || "3306");

  try {
    const db = await initDb();
    
    // Verificando se o objeto retornado é o Wrapper do MySQL ou o SQLite
    // O MySQLWrapper tem a propriedade 'pool'
    if (db.pool) {
      console.log("\n✅ SUCESSO: O site está conectado ao MySQL da Hostinger!");
      const counts = {
        barbeiros: (await db.get("SELECT COUNT(*) as count FROM barbers")).count,
        servicos: (await db.get("SELECT COUNT(*) as count FROM services")).count,
        agendamentos: (await db.get("SELECT COUNT(*) as count FROM appointments")).count
      };
      console.log("Dados encontrados no MySQL:");
      console.log(JSON.stringify(counts, null, 2));
    } else {
      console.log("\n⚠️ AVISO: O site NÃO conseguiu conectar ao MySQL e está usando o SQLite local (vazio).");
      console.log("Isso geralmente acontece por senha incorreta ou bloqueio de IP na Hostinger.");
    }
  } catch (error) {
    console.error("\n❌ ERRO CRÍTICO no teste:", error.message);
  }
  process.exit(0);
}

test();
