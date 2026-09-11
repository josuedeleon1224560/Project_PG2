import bcrypt from 'bcryptjs';
import { query } from '../config/db.js';

/**
 * Catálogo base de Roles institucionales MSPAS
 */
const ROLES_MSPAS = [
  { id_rol: 1, nombre_rol: 'Administrador', descripcion: 'Gestión total del sistema, usuarios y reportes' },
  { id_rol: 2, nombre_rol: 'Médico General', descripcion: 'Evaluación gineco-obstétrica y emisión de boletas ARO' },
  { id_rol: 3, nombre_rol: 'Gineco-Obstetra', descripcion: 'Recepción hospitalaria de referencias y contrarreferencias' },
  { id_rol: 4, nombre_rol: 'Enfermería Profesional', descripcion: 'Captura de signos vitales y cribado de 25 factores' },
  { id_rol: 5, nombre_rol: 'Técnico en Salud Rural', descripcion: 'Captación comunitaria de gestantes en Suchitepéquez' },
  { id_rol: 6, nombre_rol: 'Digitador de Admisión', descripcion: 'Registro de expedientes y admisión de gestantes' }
];

/**
 * Catálogo base de Establecimientos de Salud en Suchitepéquez
 */
const ESTABLECIMIENTOS_SUCHITEPEQUEZ = [
  { id_establecimiento: 1, nombre_establecimiento: 'Hospital Nacional de Mazatenango', nivel_atencion: '2do Nivel', municipio: 'Mazatenango' },
  { id_establecimiento: 2, nombre_establecimiento: 'Centro de Salud Mazatenango (DDRISS)', nivel_atencion: '1er Nivel', municipio: 'Mazatenango' },
  { id_establecimiento: 3, nombre_establecimiento: 'Centro de Salud San Antonio Suchitepéquez', nivel_atencion: '1er Nivel', municipio: 'San Antonio Suchitepéquez' },
  { id_establecimiento: 4, nombre_establecimiento: 'Centro de Salud Chicacao', nivel_atencion: '1er Nivel', municipio: 'Chicacao' },
  { id_establecimiento: 5, nombre_establecimiento: 'Centro de Salud Cuyotenango', nivel_atencion: '1er Nivel', municipio: 'Cuyotenango' },
  { id_establecimiento: 6, nombre_establecimiento: 'Centro de Salud Patulul', nivel_atencion: '1er Nivel', municipio: 'Patulul' },
  { id_establecimiento: 7, nombre_establecimiento: 'Centro de Salud Santo Domingo Suchitepéquez', nivel_atencion: '1er Nivel', municipio: 'Santo Domingo Suchitepéquez' },
  { id_establecimiento: 8, nombre_establecimiento: 'Centro de Salud Samayac', nivel_atencion: '1er Nivel', municipio: 'Samayac' },
  { id_establecimiento: 9, nombre_establecimiento: 'Centro de Salud San Bernardino', nivel_atencion: '1er Nivel', municipio: 'San Bernardino' },
  { id_establecimiento: 10, nombre_establecimiento: 'Centro de Salud San Gabriel', nivel_atencion: '1er Nivel', municipio: 'San Gabriel' },
  { id_establecimiento: 11, nombre_establecimiento: 'Centro de Salud San Lorenzo', nivel_atencion: '1er Nivel', municipio: 'San Lorenzo' },
  { id_establecimiento: 12, nombre_establecimiento: 'Centro de Salud San Miguel Panán', nivel_atencion: '1er Nivel', municipio: 'San Miguel Panán' },
  { id_establecimiento: 13, nombre_establecimiento: 'Centro de Salud San Pablo Jocopilas', nivel_atencion: '1er Nivel', municipio: 'San Pablo Jocopilas' },
  { id_establecimiento: 14, nombre_establecimiento: 'Centro de Salud Santa Bárbara', nivel_atencion: '1er Nivel', municipio: 'Santa Bárbara' },
  { id_establecimiento: 15, nombre_establecimiento: 'Centro de Salud Santo Tomás La Unión', nivel_atencion: '1er Nivel', municipio: 'Santo Tomás La Unión' },
  { id_establecimiento: 16, nombre_establecimiento: 'Centro de Salud Zunilito', nivel_atencion: '1er Nivel', municipio: 'Zunilito' },
  { id_establecimiento: 17, nombre_establecimiento: 'Centro de Salud Pueblo Nuevo', nivel_atencion: '1er Nivel', municipio: 'Pueblo Nuevo' },
  { id_establecimiento: 18, nombre_establecimiento: 'Centro de Salud Río Bravo', nivel_atencion: '1er Nivel', municipio: 'Río Bravo' }
];

/**
 * Listar todos los usuarios registrados
 * GET /api/usuarios
 */
export const listarUsuarios = async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        u.id_usuario,
        u.nombres,
        u.apellidos,
        u.email,
        u.id_rol,
        COALESCE(r.nombre_rol, u.rol, 'Personal de Salud') AS rol,
        COALESCE(u.establecimiento, 'DDRISS Suchitepéquez') AS establecimiento,
        COALESCE(u.estado, 'ACTIVO') AS estado
      FROM usuarios u
      LEFT JOIN roles r ON u.id_rol = r.id_rol
      ORDER BY u.id_usuario ASC
    `);

    return res.status(200).json({
      success: true,
      total: result.rowCount,
      usuarios: result.rows
    });
  } catch (error) {
    console.error('Error al listar usuarios:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al consultar la lista de usuarios.'
    });
  }
};

/**
 * Crear un nuevo usuario en la base de datos
 * POST /api/usuarios
 */
export const crearUsuario = async (req, res) => {
  try {
    const {
      nombres,
      apellidos,
      email,
      password,
      id_rol,
      rol,
      establecimiento,
      estado = 'ACTIVO'
    } = req.body;

    if (!nombres || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Los nombres, el correo electrónico y la contraseña son obligatorios.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe tener al menos 6 caracteres.'
      });
    }

    // Verificar si el correo ya existe
    const existeRes = await query(
      'SELECT id_usuario FROM usuarios WHERE LOWER(email) = LOWER($1)',
      [email.trim()]
    );

    if (existeRes.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Ya existe un usuario registrado con este correo electrónico.'
      });
    }

    // Generar Hash seguro de la contraseña
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Determinar id_rol y nombre_rol
    let rolIdFinal = id_rol ? parseInt(id_rol, 10) : 2;
    let rolNombreFinal = rol || 'Médico General';

    if (id_rol) {
      const rolEnc = ROLES_MSPAS.find(r => r.id_rol === rolIdFinal);
      if (rolEnc) rolNombreFinal = rolEnc.nombre_rol;
    } else if (rol) {
      const rolEnc = ROLES_MSPAS.find(r => r.nombre_rol.toLowerCase() === rol.toLowerCase());
      if (rolEnc) {
        rolIdFinal = rolEnc.id_rol;
        rolNombreFinal = rolEnc.nombre_rol;
      }
    }

    const establecimientoAsignado = establecimiento || 'Hospital Nacional de Mazatenango';

    const insertRes = await query(`
      INSERT INTO usuarios (
        nombres,
        apellidos,
        email,
        password_hash,
        id_rol,
        rol,
        establecimiento,
        estado
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id_usuario, nombres, apellidos, email, id_rol, rol, establecimiento, estado
    `, [
      nombres.trim(),
      (apellidos || '').trim(),
      email.trim().toLowerCase(),
      password_hash,
      rolIdFinal,
      rolNombreFinal,
      establecimientoAsignado,
      estado
    ]);

    return res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente.',
      usuario: insertRes.rows[0]
    });

  } catch (error) {
    console.error('Error al crear usuario:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno al registrar el usuario.'
    });
  }
};

/**
 * Alternar estado de un usuario (ACTIVO / INACTIVO)
 * PUT /api/usuarios/:id/estado
 */
export const cambiarEstadoUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    const nuevoEstado = estado || 'ACTIVO';

    const updateRes = await query(`
      UPDATE usuarios
      SET estado = $1
      WHERE id_usuario = $2
      RETURNING id_usuario, nombres, apellidos, email, id_rol, rol, establecimiento, estado
    `, [nuevoEstado, id]);

    if (updateRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado.'
      });
    }

    return res.status(200).json({
      success: true,
      message: `Estado de usuario actualizado a ${nuevoEstado}.`,
      usuario: updateRes.rows[0]
    });
  } catch (error) {
    console.error('Error al actualizar estado del usuario:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al cambiar el estado del usuario.'
    });
  }
};

/**
 * Listar catálogo de roles desde la base de datos
 * GET /api/usuarios/catalogos/roles
 */
export const listarRoles = async (req, res) => {
  try {
    const result = await query('SELECT id_rol, nombre_rol, descripcion FROM roles ORDER BY id_rol ASC');
    return res.status(200).json({
      success: true,
      roles: result.rows.length > 0 ? result.rows : ROLES_MSPAS
    });
  } catch (error) {
    console.error('Error al consultar roles en base de datos:', error);
    return res.status(200).json({
      success: true,
      roles: ROLES_MSPAS
    });
  }
};

/**
 * Listar catálogo de establecimientos
 * GET /api/usuarios/catalogos/establecimientos
 */
export const listarEstablecimientos = (req, res) => {
  return res.status(200).json({
    success: true,
    establecimientos: ESTABLECIMIENTOS_SUCHITEPEQUEZ
  });
};
