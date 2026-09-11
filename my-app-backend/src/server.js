import dotenv from 'dotenv';
import app from './app.js';
import { initDatabaseSchema } from './config/initDb.js';

// Cargar variables de entorno desde el archivo .env
dotenv.config();

const PORT = process.env.PORT || 4000;

// Inicializar el servidor HTTP y sincronizar esquema
app.listen(PORT, async () => {
    console.log(`=========================================`);
    console.log(`Servidor SIREP listo y en ejecucion`);
    console.log(`URL: http://localhost:${PORT}`);
    console.log(`Entorno: ${process.env.NODE_ENV || 'development'}`);
    console.log(`=========================================`);
    await initDatabaseSchema();
});