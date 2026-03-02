import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config();

async function checkConnection() {
  const host = process.env.DB_HOST;
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  const database = process.env.DB_NAME;
  const port = Number(process.env.DB_PORT) || 3306;

  console.log('--- Verificação de Conexão MySQL ---');
  console.log(`Host: ${host || 'NÃO DEFINIDO'}`);
  console.log(`User: ${user || 'NÃO DEFINIDO'}`);
  console.log(`Database: ${database || 'NÃO DEFINIDO'}`);
  console.log(`Port: ${port}`);
  console.log(`Password: ${password ? 'DEFINIDA' : 'NÃO DEFINIDA'}`);

  if (!host || !user) {
    console.log('\nERRO: Variáveis de ambiente DB_HOST ou DB_USER não encontradas.');
    console.log('Certifique-se de que você as configurou no painel do Google AI Studio.');
    return;
  }

  try {
    console.log('\nTentando conectar...');
    const connection = await mysql.createConnection({
      host,
      port,
      user,
      password,
      database,
      connectTimeout: 10000
    });
    console.log('SUCESSO: Conectado ao MySQL da Hostinger!');
    await connection.end();
  } catch (error: any) {
    console.log('\nFALHA na conexão:');
    console.error(error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\nDICA: O servidor recusou a conexão. Verifique se o IP está liberado no "MySQL Remoto" da Hostinger.');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\nDICA: Usuário ou senha incorretos.');
    } else if (error.code === 'ETIMEDOUT') {
      console.log('\nDICA: Tempo de conexão esgotado. Isso geralmente acontece quando o firewall da Hostinger está bloqueando o acesso.');
    }
  }
}

checkConnection();
