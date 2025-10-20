/**
 * Flujo de auth con sesiones (versión mínima para la clase):
 * - POST /register → crea usuario (rol 'admin' SOLO si se usan credenciales de práctica)
 * - POST /login    → valida credenciales y setea datos mínimos en req.session.user
 *
 * Importante:
 * - La cookie 'connect.sid' NO guarda los datos del usuario. Guarda un ID de sesión firmado.
 * - Los datos reales (req.session.user) viven en el store del servidor (Mongo/Redis/Memory).
 * - Este ejemplo NO incluye /me ni /logout para mantener el foco (se agregan en la próxima parte).
 */

import { Router } from 'express';
import User from '../models/User.js'; // Modelo Mongoose con hash + comparePassword

const router = Router();

/**
 * POST /api/sessions/register
 * Crea un usuario en la base. Si usa las credenciales didácticas,
 * lo marcamos como admin (SOLO para la práctica; no dejar en prod).
 *
 * Body (JSON):
 * {
 *   "name": "Estudiante",
 *   "age": 22,
 *   "email": "alumno@test.com",
 *   "password": "123456"
 * }
 *
 * Respuestas:
 * - 201 Created: { ok: true, id: "<mongoId>" }
 * - 400 Bad Request: faltan campos
 * - 409/500: errores al guardar (ej. email duplicado, validación)
 */
router.post('/register', async (req, res, next) => {
  try {
    // 1) Tomo datos del body (asumo que express.json() ya está montado en app.js)
    const { name, age, email, password } = req.body || {};

    // 2) Validación mínima para no guardar basura (dejamos lo fino para otra clase)
    if (!name || age == null || !email || !password) {
      return res
        .status(400)
        .json({ error: 'Faltan campos requeridos: name, age, email, password' });
    }

    // 3) Normalizamos email (evita duplicados lógicos)
    const normEmail = String(email).toLowerCase().trim();

    // 4) Atajo didáctico: si se registra con estas credenciales, queda admin.
    //    NO dejar esto en producción.
    const isAdmin = (normEmail === 'admincoder@coder.com' && password === 'adminCod3r123');

    // 5) Creamos el usuario.
    //    OJO: el "password" se hashea en el pre('save') del modelo.
    const user = await User.create({
      name,
      age,
      email: normEmail,
      password,                 // se hashea en el pre('save')
      role: isAdmin ? 'admin' : 'user'
    });

    // 6) Devolvemos 201 con el id. (No devolvemos el user completo ni el password)
    return res.status(201).json({ ok: true, id: user._id });
  } catch (err) {
    // 7) Si hay error (dup key, validación, etc.), lo maneja el error handler global.
    return next(err);
  }
});

/**
 * POST /api/sessions/login
 * Verifica credenciales y, si son válidas, crea/actualiza la sesión con datos mínimos
 * en req.session.user. A partir de este momento, el servidor enviará "Set-Cookie: connect.sid"
 * y el cliente la reenviará en cada request (mientras no expire).
 *
 * Body (JSON):
 * { "email": "alumno@test.com", "password": "123456" }
 *
 * Respuestas:
 * - 200 OK: { ok: true } (si login correcto, ya dejó la sesión lista)
 * - 400 Bad Request: faltan campos
 * - 401 Unauthorized: credenciales inválidas
 */
router.post('/login', async (req, res, next) => {
  try {
    // 1) Tomo credenciales
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'Faltan email o password' });
    }

    // 2) Normalizo email
    const normEmail = String(email).toLowerCase().trim();

    // 3) Atajo de admin para la práctica (NO en prod)
    if (normEmail === 'admincoder@coder.com' && password === 'adminCod3r123') {
      // Guardamos datos mínimos de sesión (principio de mínima exposición)
      req.session.user = { email: normEmail, name: 'Admin', role: 'admin' };
      return res.json({ ok: true });
    }

    // 4) Usuario normal: lo buscamos
    const user = await User.findOne({ email: normEmail });
    // Si no existe o el password no coincide, devolvemos 401 (mensaje genérico)
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // 5) Guardamos SOLO lo necesario en la sesión (evitar datos sensibles)
    req.session.user = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role || 'user' // si tu modelo ya guarda el rol, respétalo
    };

    // 6) Listo. El middleware de sesión persiste esto en el store y setea la cookie.
    return res.json({ ok: true });
  } catch (err) {
    return next(err);
  }
});

export default router;
