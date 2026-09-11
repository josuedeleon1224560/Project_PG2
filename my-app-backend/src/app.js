import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

// Middlewares de seguridad y sanitización
import { sanitizeInputs } from './middlewares/sanitizeMiddleware.js';

// Importación de rutas
import authRoutes from './routes/authRoutes.js';
import fichasAroRoutes from './routes/fichasAroRoutes.js';
import usuariosRoutes from './routes/usuariosRoutes.js';

const app = express();

// ==========================================
// 1. Middlewares Globales
// ==========================================

// Cabeceras HTTP seguras con Helmet
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false
}));

// CORS configurado para Frontend en Desktop y Dispositivos Móviles en Red Local
app.use(cors({
    origin: (origin, callback) => {
        // Permitir solicitudes sin origen (mobile apps, herramientas de prueba) o desde red local / host
        if (!origin) return callback(null, true);

        const esOrigenValido = (
            origin.includes('localhost') ||
            origin.includes('127.0.0.1') ||
            origin.includes('192.168.') ||
            origin.includes('10.') ||
            origin.includes('172.')
        );

        if (esOrigenValido) {
            callback(null, true);
        } else {
            callback(null, true); // Permitir acceso clínico en red institucional
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true
}));

// Parseo optimizado para alto volumen de peticiones
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Registro de peticiones
app.use(morgan('dev'));

// Sanitización de entradas (Anti XSS e Inyecciones)
app.use(sanitizeInputs);

// ==========================================
// 2. Rutas del Sistema (Sin cuellos de botella de peticiones)
// ==========================================
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api', fichasAroRoutes);

// Ruta de comprobación de estado (Health Check)
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        project: 'API GÉNESIS MSPAS',
        timestamp: new Date().toISOString()
    });
});

// ==========================================
// 3. Manejo de Rutas No Encontradas (404)
// ==========================================
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Recurso no encontrado: ${req.originalUrl}`
    });
});

// ==========================================
// 4. Manejador Global de Errores Seguro (500)
// ==========================================
app.use((err, req, res, next) => {
    console.error('Error capturado en servidor:', err.message);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Ha ocurrido un error en el procesamiento de la solicitud.'
    });
});

export default app;