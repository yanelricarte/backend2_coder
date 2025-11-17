
import { Router } from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';


const router = Router();

const COOKIE = process.env.COOKIE_NAME || 'currentUser';
const IS_PROD = process.env.NODE_ENV === 'production';
const { JWT_SECRET, JWT_EXPIRES = '15m' } = process.env;
const sign = (payload) => jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });


const cookieOpts = {
  httpOnly: true,
  signed: true,
  sameSite: 'lax',      // si hay otro dominio: 'none' + secure:true
  secure: IS_PROD,
  maxAge: 15 * 60 * 1000,
  path: '/'
};

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
    res.cookie(COOKIE, token, cookieOpts);
    return res.json({ ok: true });
  })(req, res, next);
});


/* LOGIN (WEB) igual que el login api pero responde con redirect /current */

router.post('/login-web', (req, res, next) => {
  passport.authenticate('local', { session: false }, (err, user) => {
    if (err) return next(err);
    if (!user) return res.redirect('/login?error=Credenciales%20inv%C3%A1lidas');

    const token = sign({ id: user.id, email: user.email, role: user.role });
    res.cookie(COOKIE, token, cookieOpts);
    return res.redirect('/current');
  })(req, res, next);
});



/* ============== /logout (API) -> borra CO0OKIE) ============== */

router.post('/logout', (_req, res) => {
  res.clearCookie(COOKIE, { path: '/' });
  res.json({ ok: true, message: 'Token eliminado' });
});


/* ============== /logout (web) -> limpia y redirige ) ============== */

router.post('/logout-web', (_req, res) => {
  res.clearCookie(COOKIE, {
    path: '/',
    sameSite: 'lax',
    secure: IS_PROD,
    httpOnly: true,
    signed: true
  });
  return res.redirect(303, '/login');
});

// ----------------------------------------------------------------
// CURRENT(API): protegido  con PASSPORT JWT
router.get('/current',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    const { id, email, role } = req.user || {};
    return res.json({ ok: true, user: { id, email, role } });
  }
);


export default router;
