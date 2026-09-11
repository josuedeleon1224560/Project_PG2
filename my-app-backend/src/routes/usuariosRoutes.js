import { Router } from 'express';
import {
  listarUsuarios,
  crearUsuario,
  cambiarEstadoUsuario,
  listarRoles,
  listarEstablecimientos
} from '../controllers/usuariosController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';

const router = Router();

// Rutas de administración de usuarios protegidas por JWT
router.get('/', verifyToken, listarUsuarios);
router.post('/', verifyToken, crearUsuario);
router.put('/:id/estado', verifyToken, cambiarEstadoUsuario);
router.get('/catalogos/roles', verifyToken, listarRoles);
router.get('/catalogos/establecimientos', verifyToken, listarEstablecimientos);

export default router;
