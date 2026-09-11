import { Router } from 'express';
import { login, getProfile } from '../controllers/authController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';

const router = Router();

// Ruta pública para autenticarse
router.post('/login', login);

// Ruta protegida para validar sesión activa
router.get('/me', verifyToken, getProfile);

export default router;