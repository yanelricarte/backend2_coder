import jwt from 'jsonwebtoken';
import { config } from '../config/config.js'; // fuente única de verdad

/**
 * Middleware que adjunta el usuario a req.user (y a res.locals.user)
 * si encuentra un JWT válido en la cookie.
 *
 */
export const attachUserFromCookie = (req, res, next) => {
  // Centralizado: nombre de cookie y secret JWT salen de config.js
  const COOKIE_NAME = config.cookieName;     // p.ej. 'currentUser'
  const JWT_SECRET  = config.jwtSecret;

  // Inicializamos SIEMPRE, así las vistas pueden hacer {{#if user}} ...
  req.user = undefined;
  res.locals.user = undefined;

  try {
    // 1) Tomamos PRIMERO la cookie *firmada* (recomendado en prod).
    // 2) En DEV, permitimos fallback a no firmada para evitar "no me funciona"
    //    cuando alguien olvidó cookieParser(secret) o probó con otra rama.
    const token =
      req.signedCookies?.[COOKIE_NAME] ||
      req.cookies?.[COOKIE_NAME] || // ← fallback dev
      null;

    // Si no hay token en cookies, seguimos como invitado (no es error).
    if (!token) return next();

    // Verificamos firma y expiración del JWT.
    // Si algo falla (vencido / alterado), caemos al catch y seguimos como invitado.
    const payload = jwt.verify(token, JWT_SECRET);

    // Estandarizamos el "shape" esperado por SSR y (opcionalmente) por front:
    // - id/sub: soportamos ambos para compatibilidad con ramas que usan 'sub'
    // - role: lo llevamos a MAYÚSCULAS para alinear con políticas (ADMIN/USER/USER_PREMIUM)
    const normalizedRole = String(payload.role || 'USER').toUpperCase();
    const user = {
      id: payload.id ?? payload.sub ?? null,
      email: payload.email,
      role: normalizedRole
    };

    // Exponemos en request (controladores) y en locals (plantillas HBS)
    req.user = user;
    res.locals.user = user;

    return next();
  } catch (_err) {
    // Cookie ausente, vencida o inválida → UX robusta: continuamos sin usuario.
    return next();
  }
};
