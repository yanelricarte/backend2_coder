
import jwt from 'jsonwebtoken';
import { config } from '../config/config.js';

// Conjunto de políticas "semánticas" (evitamos strings sueltos)
export const POL = Object.freeze({
  PUBLIC: 'PUBLIC',
  AUTHENTICATED: 'AUTHENTICATED',
  USER: 'USER',
  USER_PREMIUM: 'USER_PREMIUM',
  ADMIN: 'ADMIN',
});

// ---------------------------------------------------------------------------
// Helpers internos
// ---------------------------------------------------------------------------

// Extrae token de cookie firmada (preferida) o de Authorization: Bearer
const getToken = (req) => {
  const fromCookie =
    req.signedCookies?.[config.cookieName] ||
    req.cookies?.[config.cookieName] ||
    null;
  if (fromCookie) return fromCookie;

  const h = req.headers.authorization || '';
  if (h.startsWith('Bearer ')) return h.slice(7);
  return null;
};

// Fallback para enviar error uniforme si el Router base no inyectó sendError
const sendError = (res, message, status = 400) => {
  if (typeof res.sendError === 'function') return res.sendError(message, status);
  return res.status(status).json({ status: 'error', message });
};

// ---------------------------------------------------------------------------
// Middleware de políticas
//   Uso típico (con Router base):
//   this.get('/admin', [handlePolicies([POL.ADMIN])], ctrl)
// ---------------------------------------------------------------------------
export const handlePolicies = (required = [POL.PUBLIC]) => (req, res, next) => {
  // 1) PUBLIC: no exige credencial
  if (required.includes(POL.PUBLIC)) return next();

  // 2) Necesitamos un token (cookie firmada o Bearer)
  const token = getToken(req);
  if (!token) return sendError(res, 'Token requerido', 401); // 401: sin credencial

  try {
    // 3) Verificamos firma y expiración del JWT
    const payload = jwt.verify(token, config.jwtSecret);

    // 4) Normalizamos forma del usuario para el resto de la app:
    //    - id/sub: soportamos ambos
    //    - role: en MAYÚSCULAS (coherente con POL.*)
    const roleNorm = String(payload.role || 'USER').toUpperCase();
    req.user = {
      id: payload.id ?? payload.sub ?? null,
      email: payload.email,
      role: roleNorm
    };

    // 5) Si la política pedida es solo "AUTHENTICATED", alcanzó con validar token
    if (required.includes(POL.AUTHENTICATED)) return next();

    // 6) Caso de roles concretos (USER, USER_PREMIUM, ADMIN)
    if (!req.user.role) return sendError(res, 'Rol no presente en token', 403);
    if (!required.includes(req.user.role)) return sendError(res, 'Acceso denegado', 403);

    return next();
  } catch (_e) {
    // Firma inválida o expirado → credencial no usable
    return sendError(res, 'Token inválido o expirado', 403);
  }
};
