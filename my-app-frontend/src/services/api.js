/**
 * Servicio Centralizado de API para SIREP MSPAS (Proyecto Génesis)
 * Conecta el Frontend con los endpoints REST del Backend en Node.js/PostgreSQL
 */

export const getApiBaseUrl = () => {
  if (typeof window !== 'undefined' && window.location) {
    // Si estamos en desarrollo local con Vite (puerto 5173)
    if (window.location.port === '5173') {
      return `http://${window.location.hostname}:4000/api`;
    }
    // En produccion (Nginx en puerto 80/443 o cualquier dominio/IP)
    return '/api';
  }
  return '/api';
};

export const API_BASE_URL = getApiBaseUrl();

/**
 * Helper seguro para peticiones HTTP con JWT y Manejo de Sesión
 */
const apiFetch = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token') || '';

  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      if (response.status === 401) {
        console.warn('Sesión no autorizada o expirada.');
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        window.dispatchEvent(new Event('sirep:logout'));
      }
      throw new Error(data.message || `Error en la solicitud (Código ${response.status})`);
    }

    return data;

  } catch (error) {
    if (error.name === 'AbortError') {
      return { success: false, aborted: true };
    }
    console.error(`Error en apiFetch [${endpoint}]:`, error.message);
    throw error;
  }
};

// ==========================================
// 1. DASHBOARD GERENCIAL
// ==========================================

/**
 * Consultar métricas e indicadores en vivo para el Tablero DDRISS con filtros
 */
export const cargarEstadisticas = async (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.municipio && params.municipio !== 'TODOS') queryParams.append('municipio', params.municipio);
  if (params.fecha_inicio) queryParams.append('fecha_inicio', params.fecha_inicio);
  if (params.fecha_fin) queryParams.append('fecha_fin', params.fecha_fin);
  const qs = queryParams.toString() ? `?${queryParams.toString()}` : '';
  return await apiFetch(`/dashboard/estadisticas${qs}`);
};

// ==========================================
// 2. ADMISIÓN Y GESTIÓN DE PACIENTES
// ==========================================

/**
 * Listar pacientes registradas en la base de datos
 */
export const cargarPacientes = async () => {
  const res = await apiFetch('/pacientes');
  return res.pacientes || [];
};

/**
 * Buscar paciente por los 13 dígitos de su CUI/DPI
 */
export const buscarPacientePorCUI = async (cui) => {
  return await apiFetch(`/pacientes/buscar/${encodeURIComponent(cui)}`);
};

/**
 * Registrar nuevo expediente de gestante
 */
export const crearPaciente = async (datosPaciente) => {
  return await apiFetch('/pacientes', {
    method: 'POST',
    body: JSON.stringify(datosPaciente)
  });
};

/**
 * Actualizar datos / antecedentes obstétricos de una paciente
 */
export const actualizarPaciente = async (idPaciente, datosPaciente) => {
  return await apiFetch(`/pacientes/${idPaciente}`, {
    method: 'PUT',
    body: JSON.stringify(datosPaciente)
  });
};

// ==========================================
// 3. EVALUACIÓN EPIDEMIOLÓGICA Y FICHAS ARO
// ==========================================

/**
 * Evaluar los 25 factores normados y guardar la Ficha ARO
 */
export const evaluarFichaARO = async (payload) => {
  return await apiFetch('/fichas/evaluar', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

/**
 * Listar historial de evaluaciones y boletas emitidas
 */
export const cargarHistorialBoletas = async () => {
  const res = await apiFetch('/fichas/historial');
  return res.fichas || [];
};

/**
 * Guardar borrador temporal para transferir al teléfono por QR
 */
export const guardarBorradorMovil = async (payload) => {
  return await apiFetch('/fichas/borrador-movil', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

/**
 * Obtener borrador temporal para continuar llenado en teléfono
 */
export const obtenerBorradorMovil = async (token) => {
  return await apiFetch(`/fichas/borrador-movil/${token}`);
};

// ==========================================
// 4. DESPACHO DE ALERTAS Y NOTIFICACIONES
// ==========================================

/**
 * Disparar alerta vía WhatsApp
 */
export const despacharAlertaWhatsApp = async (idFicha, payload = {}) => {
  return await apiFetch(`/fichas/boleta/${idFicha}/enviar-whatsapp`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

/**
 * Despachar boleta con PDF adjunto por Correo Electrónico (SMTP)
 */
export const despacharAlertaEmail = async (idFicha, payload = {}) => {
  return await apiFetch(`/fichas/boleta/${idFicha}/enviar-email`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

// ==========================================
// 5. ADMINISTRACIÓN DE USUARIOS
// ==========================================

/**
 * Listar usuarios del sistema
 */
export const cargarUsuarios = async () => {
  const res = await apiFetch('/usuarios');
  return res.usuarios || [];
};

/**
 * Crear un nuevo usuario
 */
export const crearUsuario = async (datosUsuario) => {
  return await apiFetch('/usuarios', {
    method: 'POST',
    body: JSON.stringify(datosUsuario)
  });
};

/**
 * Cambiar estado de usuario (ACTIVO / INACTIVO)
 */
export const cambiarEstadoUsuario = async (idUsuario, estado) => {
  return await apiFetch(`/usuarios/${idUsuario}/estado`, {
    method: 'PUT',
    body: JSON.stringify({ estado })
  });
};

/**
 * Listar roles disponibles
 */
export const cargarRoles = async () => {
  const res = await apiFetch('/usuarios/catalogos/roles');
  return res.roles || [];
};

/**
 * Listar establecimientos disponibles
 */
export const cargarEstablecimientos = async () => {
  const res = await apiFetch('/usuarios/catalogos/establecimientos');
  return res.establecimientos || [];
};
