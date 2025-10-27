/**
 * Flujo de auth con sesiones (versión para la clase con Passport y logs):
 * - POST /register → crea usuario (hash de password en el modelo)
 * - POST /login    → autentica con Passport Local y setea req.session.user
 * - GET  /me       → devuelve datos desde la sesión (no desde DB)
 * - POST /logout   → destruye la sesión y limpia la cookie
 *
 * Importante:
 * - La cookie 'connect.sid' NO guarda datos del usuario. Guarda un ID de sesión firmado.
 * - Los datos (req.session.user) viven en el store del servidor; los "reales" en la DB.
 */

import { Router } from 'express';
import User from '../models/User.js';            // Modelo con hash + comparePassword
import passport from '../config/passport.js';    // Nuestra config de Passport

const router = Router();

/* ================== REGISTER ================== */
/**
 * POST /api/sessions/register
 * Crea un usuario en la base.
 */
router.post('/register', async (req, res, next) => {
  try {
    const { name, age, email, password } = req.body || {};
    if (!name || age == null || !email || !password) {
      return res.status(400).json({ error: 'Faltan campos requeridos: name, age, email, password' });
    }
    const normEmail = String(email).toLowerCase().trim();

    // Atajo didáctico (si lo querés mantener para demo): marcar admin por credenciales
    const isAdmin = (normEmail === 'admincoder@coder.com' && password === 'adminCod3r123');

    const user = await User.create({
      name,
      age,
      email: normEmail,
      password,           // se hashea en el pre('save') del modelo
      role: isAdmin ? 'admin' : 'user'
    });

    console.log('[REGISTER] ok', { id: user._id.toString(), email: user.email, role: user.role });
    return res.status(201).json({ ok: true, id: user._id });
  } catch (err) {
    return next(err);
  }
});

/* ===========================================================
 * 🚫 LOGIN ANTERIOR (COMENTAR para usar Passport)
 * Dejalo comentado para que quede el histórico, pero que NO ejecute.
 * ===========================================================
 *
 * router.post('/login', async (req, res, next) => {
 *   try {
 *     const { email, password } = req.body || {};
 *     if (!email || !password) {
 *       return res.status(400).json({ error: 'Faltan email o password' });
 *     }
 *     const normEmail = String(email).toLowerCase().trim();
 *     const user = await User.findOne({ email: normEmail });
 *     if (!user || !(await user.comparePassword(password))) {
 *       return res.status(401).json({ error: 'Credenciales inválidas' });
 *     }
 *     req.session.user = {
 *       id: user._id.toString(),
 *       email: user.email,
 *       name: user.name,
 *       role: user.role || 'user'
 *     };
 *     return res.json({ ok: true });
 *   } catch (err) { return next(err); }
 * });
 */

/* ================== LOGIN (Passport + logs) ================== */
/**
 * POST /api/sessions/login
 * Usa Passport Local para verificar credenciales y luego:
 * - Regenera el id de sesión (seguridad)
 * - Llama a req.login(user) para fijar req.user (Passport)
 * - Setea req.session.user con un objeto mínimo (tu contrato actual)
 */
router.post('/login', (req, res, next) => {
  console.log('[LOGIN] req', { email: req.body?.email });

  passport.authenticate('local', (err, user, _info) => {
    if (err) {
      console.log('[LOGIN] error', { message: err.message });
      return next(err);
    }
    if (!user) {
      console.log('[LOGIN] 401 (credenciales inválidas)');
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Seguridad: evitar session fixation → regenerar el id de sesión
    req.session.regenerate(err2 => {
      if (err2) {
        console.log('[LOGIN] regen_error', { message: err2.message });
        return next(err2);
      }
      console.log('[LOGIN] session_regenerated', { sid: req.sessionID });

      // Integración Passport ↔ Sesión (crea req.user)
      req.login(user, err3 => {
        if (err3) {
          console.log('[LOGIN] req.login_error', { message: err3.message });
          return next(err3);
        }
        console.log('[LOGIN] req.user listo', { email: req.user?.email, role: req.user?.role });

        // Tu contrato minimalista (lo que consumen tus rutas actuales)
        req.session.user = {
          id:    user._id.toString(),
          email: user.email,
          name:  user.name,
          role:  user.role || 'user'
        };
        console.log('[LOGIN] session.user seteado', req.session.user);

        return res.json({ ok: true });
      });
    });
  })(req, res, next);
});

/* ============== Middleware: autenticación con logs ============== */
function isAuthenticated(req, res, next) {
  if (req.session?.user) {
    console.log('[AUTH] ok', { email: req.session.user.email });
    return next();
  }
  console.log('[AUTH] 401 (sin sesión)');
  return res.status(401).json({ error: "No autenticado" });
}

/* ============== /me (privada: sale de la sesión) ============== */
/**
 * GET /api/sessions/me
 * Devuelve lo que guardamos en req.session.user (no consulta DB).
 */
router.get("/me", isAuthenticated, (req, res) => {
  console.log('[SESSIONS:ME] devolver', req.session.user);
  res.json({ user: req.session.user });
});

/* ============== /logout (destruye la sesión) ============== */
/**
 * POST /api/sessions/logout
 * Destruye la sesión y limpia la cookie 'connect.sid'
 */
router.post("/logout", (req, res, next) => {
  const sid = req.sessionID;
  console.log('[LOGOUT] req', { sid, email: req.session?.user?.email });
  req.session.destroy(err => {
    if (err) {
      console.log('[LOGOUT] error', { message: err.message });
      return next(err);
    }
    res.clearCookie("connect.sid");
    console.log('[LOGOUT] ok', { sid });
    res.json({ ok: true, message: "Sesión finalizada" });
  });
});

export default router;
