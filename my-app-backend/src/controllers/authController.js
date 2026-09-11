import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';

/**
 * Iniciar Sesión y Generar Token JWT
 * POST /api/auth/login
 */
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'El correo electrónico y la contraseña son obligatorios.'
            });
        }

        // Consultar usuario en PostgreSQL (SIREP_MSPAS) con su rol
        const result = await query(
            `SELECT u.*, r.nombre_rol 
             FROM usuarios u 
             LEFT JOIN roles r ON u.id_rol = r.id_rol 
             WHERE LOWER(u.email) = LOWER($1)`,
            [email.trim()]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas.'
            });
        }

        const user = result.rows[0];

        // Validar estado de la cuenta si existe la columna
        if (user.activo === false || user.estado === 'INACTIVO' || user.estado === false) {
            return res.status(403).json({
                success: false,
                message: 'La cuenta de usuario se encuentra inactiva. Contacte al administrador.'
            });
        }

        // Comparar contraseña con el hash de bcrypt
        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas.'
            });
        }

        const nombreUsuario = user.nombre_completo || (user.nombres ? `${user.nombres} ${user.apellidos || ''}`.trim() : user.email);
        const rolUsuario = user.nombre_rol || user.rol || 'Personal de Salud';

        // Generar Token JWT
        const payload = {
            id: user.id_usuario,
            id_rol: user.id_rol,
            nombre: nombreUsuario,
            nombres: user.nombres || nombreUsuario,
            apellidos: user.apellidos || '',
            email: user.email,
            rol: rolUsuario,
            establecimiento: user.establecimiento || user.nombre_establecimiento || 'DDRISS Suchitepéquez',
            distrito: user.distrito || 'Suchitepéquez'
        };

        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET || 'super_secret_key_genesis_mspas_2026_x99!',
            { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
        );

        return res.status(200).json({
            success: true,
            message: 'Autenticación exitosa.',
            token,
            user: {
                id: user.id_usuario,
                id_usuario: user.id_usuario,
                id_rol: user.id_rol,
                nombre_rol: rolUsuario,
                rol: rolUsuario,
                nombre: nombreUsuario,
                nombres: user.nombres || nombreUsuario,
                apellidos: user.apellidos || '',
                email: user.email,
                establecimiento: user.establecimiento || user.nombre_establecimiento || 'DDRISS Suchitepéquez'
            }
        });

    } catch (error) {
        console.error('Error en login:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno en el servidor.'
        });
    }
};

/**
 * Obtener perfil del usuario autenticado
 * GET /api/auth/me
 */
export const getProfile = async (req, res) => {
    try {
        const result = await query(
            `SELECT u.id_usuario, u.nombres, u.apellidos, u.email, u.id_rol, u.establecimiento, u.estado,
                    COALESCE(r.nombre_rol, u.rol, 'Personal de Salud') AS rol,
                    r.nombre_rol
             FROM usuarios u
             LEFT JOIN roles r ON u.id_rol = r.id_rol
             WHERE u.id_usuario = $1`,
            [req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado.'
            });
        }

        const user = result.rows[0];
        const nombreUsuario = (user.nombres ? `${user.nombres} ${user.apellidos || ''}`.trim() : user.email);

        return res.status(200).json({
            success: true,
            user: {
                id: user.id_usuario,
                id_usuario: user.id_usuario,
                id_rol: user.id_rol,
                nombre_rol: user.nombre_rol || user.rol,
                rol: user.rol,
                nombre: nombreUsuario,
                nombres: user.nombres,
                apellidos: user.apellidos,
                email: user.email,
                establecimiento: user.establecimiento || 'DDRISS Suchitepéquez'
            }
        });
    } catch (error) {
        console.error('Error al obtener perfil:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al obtener la sesión del usuario.'
        });
    }
};