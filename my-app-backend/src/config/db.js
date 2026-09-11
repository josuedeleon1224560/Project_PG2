import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();
const { Pool } = pkg;

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'SIREP_MSPAS',
    port: parseInt(process.env.DB_PORT || '5432'),
    max: 10, // Máximo de conexiones simultáneas en el pool
    idleTimeoutMillis: 30000
});

pool.on('connect', () => {
    console.log('Conexión exitosa a PostgreSQL (SIREP_MSPAS)');
});

pool.on('error', (err) => {
    console.error('Error inesperado en el pool de PostgreSQL:', err);
});

export const query = (text, params) => pool.query(text, params);
export default pool;