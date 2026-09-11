import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Acceso no autorizado. Token no proporcionado o formato invalido.'
      });
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || 'super_secret_key_genesis_mspas_2026_x99!';

    jwt.verify(token, secret, (err, decodedUser) => {
      if (err) {
        return res.status(403).json({
          success: false,
          message: 'Token invalido o expirado.'
        });
      }

      req.user = decodedUser;
      next();
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error en la verificacion del token de seguridad.'
    });
  }
};

export const requireDashboardAccess = (req, res, next) => {
  const idRol = parseInt(req.user?.id_rol || 0, 10);
  const rol = String(req.user?.rol || '').toUpperCase();
  if (idRol === 1 || idRol === 2 || rol.includes('ADMIN') || rol.includes('MEDIC') || rol.includes('MÉDIC')) {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: 'Acceso restringido. Solo los roles Administrador y Médico General pueden consultar las estadísticas gerenciales.'
  });
};


