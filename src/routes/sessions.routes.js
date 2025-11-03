
import { Router } from 'express';
import User from '../models/User.js';
import passport from '../config/passport.js';
import jwt from 'jsonwebtoken';


const router = Router();

const COOKIE = process.env.COOKIE_NAME || 'currentUser';
const IS_PROD = process.env.NODE_ENV === 'production';
const { JWT_SECRET, JWT_EXPIRES = '15m' } = process.env;
const sign = (payload) => jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });



router.post('/register', async (req, res, next) => {
  try {
    const { first_name, last_name, age, email, password, cart, role } = req.body || {};
    if (!first_name || !last_name || age == null || !email || !password) {
      return res.status(400).json({ error: 'Faltan campos: first_name, last_name, age, email, password' });
    }
    const normEmail = String(email).toLowerCase().trim();

    const isAdminShortcut = (normEmail === 'admincoder@coder.com' && password === 'adminCod3r123');
    const user = await User.create({
      first_name, last_name, age,
      email: normEmail,
      password,                     // hash en pre('save')
      cart: cart ?? null,
      role: isAdminShortcut ? 'admin' : (role || 'user')
    });

    return res.status(201).json({ ok: true, id: user._id });
  } catch (err) {
    if (err?.code === 11000) return res.status(409).json({ error: 'Email already in use' });
    return next(err);
  }
});

/* LOGIN API → JSON {ok:true} + cookie JWT */
router.post('/login', (req, res, next) => {
  passport.authenticate('local', { session: false }, (err, user) => {
    if (err) return next(err);
    if (!user) return res.status(401).json({ error: 'Credenciales inválidas' });

    const token = sign({ sub: user.id, email: user.email, role: user.role });
    res.cookie(COOKIE, token, {
      httpOnly: true,
      signed: true,
      sameSite: 'lax',      // si hay otro dominio: 'none' + secure:true
      secure: IS_PROD,
      maxAge: 15 * 60 * 1000,
      path: '/'
    });
    return res.json({ ok: true });
  })(req, res, next);
});


/* ============== /logout (API) -> borra CO0OKIE) ============== */

router.post('/logout', (_req, res) => {
  res.clearCookie(COOKIE, { path: '/' });
  res.json({ ok: true, message: 'Token eliminado' });
});

export default router;
