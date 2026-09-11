/**
 * Middleware de Limitación de Tasa de Peticiones (Rate Limiting)
 * Protege contra ataques de Fuerza Bruta, Denegación de Servicio (DoS) y Escaneo
 */

const ipRequests = new Map();

// Limpieza periódica de registros de IP cada 5 minutos
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of ipRequests.entries()) {
    if (now > record.resetTime) {
      ipRequests.delete(ip);
    }
  }
}, 5 * 60 * 1000);

export const createRateLimiter = (options = {}) => {
  const windowMs = options.windowMs || 60 * 1000; // Ventana de tiempo (default: 1 minuto)
  const max = options.max || 100; // Máximo de peticiones por ventana
  const message = options.message || 'Demasiadas solicitudes desde esta dirección IP. Intente más tarde.';

  return (req, res, next) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const now = Date.now();

    let record = ipRequests.get(`${options.prefix || 'gen'}_${ip}`);

    if (!record || now > record.resetTime) {
      record = {
        count: 1,
        resetTime: now + windowMs
      };
      ipRequests.set(`${options.prefix || 'gen'}_${ip}`, record);
    } else {
      record.count += 1;
    }

    const remaining = Math.max(0, max - record.count);
    const retryAfter = Math.ceil((record.resetTime - now) / 1000);

    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000));

    if (record.count > max) {
      res.setHeader('Retry-After', retryAfter);
      return res.status(429).json({
        success: false,
        message,
        retryAfterSeconds: retryAfter
      });
    }

    next();
  };
};

/**
 * Limitador estricto para Login (Anti-Fuerza Bruta: 10 intentos cada 15 min)
 */
export const authRateLimiter = createRateLimiter({
  prefix: 'auth',
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: 'Demasiados intentos de inicio de sesión. Por seguridad, su acceso ha sido pausado temporalmente.'
});

/**
 * Limitador general de API (Anti-DoS: 250 peticiones por minuto)
 */
export const generalApiLimiter = createRateLimiter({
  prefix: 'api',
  windowMs: 60 * 1000,
  max: 250,
  message: 'Límite de peticiones excedido en el servidor. Reduzca la frecuencia de solicitudes.'
});
