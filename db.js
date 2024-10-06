import pkg from 'pg';

import dotenv from 'dotenv';

// Carrega as variáveis de ambiente do .env
const { Pool } = pkg;  // Extrai o Pool de pkg
dotenv.config();

// Configuração da conexão com PostgreSQL
const pool = new Pool({
    connectionString: process.env.POSTGRES_CONNECTION_STRING,
    ssl: {
        rejectUnauthorized: false
    }
});

// Teste a conexão
pool.connect((err) => {
    if (err) {
        console.error('Erro ao conectar no banco de dados PostgreSQL:', err.stack);
    } else {
        console.log('Conectado ao banco de dados PostgreSQL');
    }
});

// Exporta o pool para ser utilizado em outros arquivos
export default pool;
