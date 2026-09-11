import { Router } from 'express';
import { 
  buscarPacientePorCUI, 
  registrarPaciente, 
  actualizarPaciente,
  obtenerHistorialPaciente,
  listarPacientes,
  evaluarYGuardarFicha,
  listarIndicadoresARO,
  obtenerHistorialFichas,
  obtenerEstadisticasDashboard,
  descargarInformeGerencialPDF,
  descargarBoletaPDF,
  despacharAlertaEmail,
  despacharAlertaWhatsApp,
  guardarBorradorMovil,
  obtenerBorradorMovil
} from '../controllers/fichasAroController.js';
import { verifyToken, requireDashboardAccess } from '../middlewares/authMiddleware.js';

const router = Router();

// Endpoint de catálogo de indicadores (Público/Consulta)
router.get('/fichas/indicadores', listarIndicadoresARO);

// Sincronización de Borrador Móvil por Código QR
router.post('/fichas/borrador-movil', verifyToken, guardarBorradorMovil);
router.get('/fichas/borrador-movil/:token', obtenerBorradorMovil);

// Rutas de Pacientes
router.get('/pacientes', verifyToken, listarPacientes);
router.get('/pacientes/buscar/:cui', verifyToken, buscarPacientePorCUI);
router.post('/pacientes', verifyToken, registrarPaciente);
router.put('/pacientes/:id', verifyToken, actualizarPaciente);
router.get('/pacientes/:id/historial', verifyToken, obtenerHistorialPaciente);

// Endpoints de Evaluación ARO e Historial
router.get('/fichas/historial', verifyToken, obtenerHistorialFichas);
router.post('/fichas/evaluar', verifyToken, evaluarYGuardarFicha);
router.post('/fichas-aro', verifyToken, evaluarYGuardarFicha);

// Descarga oficial de Boleta de Referencia en PDF
router.get('/fichas/boleta/:id/pdf', descargarBoletaPDF);

// Despacho de Alertas Externas (Email y WhatsApp)
router.post('/fichas/boleta/:id/enviar-email', verifyToken, despacharAlertaEmail);
router.post('/fichas/boleta/:id/enviar-whatsapp', verifyToken, despacharAlertaWhatsApp);

// Dashboard Gerencial DDRISS y Descarga de Informe PDF (Exclusivo Administrador y Médico General)
router.get('/dashboard/estadisticas', verifyToken, requireDashboardAccess, obtenerEstadisticasDashboard);
router.get('/dashboard/informe-pdf', descargarInformeGerencialPDF);
router.get('/dashboard/estadisticas/pdf', descargarInformeGerencialPDF);

export default router;