import { Router } from 'express';

const router = Router();

/** Guard de invitado (UX):
 *  Si ya hay usuario (req.user), /login no tiene sentido → redirige a /current.
 */
function ensureGuest(req, res, next) {
  if (req.user) return res.redirect('/current');
  return next();
}

/** Guard de autenticación (vista privada):
 *  Si NO hay usuario, pedimos login (redirigimos con un mensaje en querystring).
 *  Importante: esto NO reemplaza autorización por rol (eso se hace en la API).
 */
function ensureAuthedView(req, res, next) {
  if (!req.user) return res.redirect('/login?error=Login%20required');
  return next();
}

/** (Pedagógico) No-cache para /login:
 *  Evita que el navegador muestre el login “cacheado” al volver con Back
 *  una vez logueados.
 */
function noCacheLogin(_req, res, next) {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  return next();
}

/** Raíz: atajo cómodo para la demo. */
router.get('/', (req, res) => {
  return req.user ? res.redirect('/current') : res.redirect('/login');
});

/** GET /login — Pública para invitados. */
router.get('/login', ensureGuest, noCacheLogin, (req, res) => {
  const error = typeof req.query.error === 'string' ? req.query.error : null;
  res.render('login', { title: 'Login', error });
});

/** GET /current — Privada para logueados (SSR usa req.user). */
router.get('/current', ensureAuthedView, (req, res) => {
  res.render('current', { title: 'Perfil', user: req.user });
});

/* ──────────────────────────────────────────────────────────────
 * DEMOS HTML que envuelven a los endpoints de la API
 *  (mismo backend, reenviando la cookie JWT HttpOnly del navegador)
 * ────────────────────────────────────────────────────────────── */

/** Helper: llamar a nuestra propia API reenviando cookies.
 *  - Usa el host/puerto de la request.
 *  - Reenvía Cookie para que /private/* valide JWT como siempre.
 *  - Node 18+ expone fetch global (no requiere dependencias).
 */
async function callApi(req, apiPath) {
  const base = `${req.protocol}://${req.get('host')}`;
  const resp = await fetch(base + apiPath, {
    method: 'GET',
    headers: {
      cookie: req.headers.cookie || '' // reenviamos la cookie HttpOnly
    }
  });
  const data = await resp.json().catch(() => ({}));
  return { status: resp.status, data };
}

/** PUBLICO (sin login): /demo/pets/:name
 *  Envuelve GET /api/pets/:name y renderiza HTML.
 */
router.get('/demo/pets/:name', async (req, res) => {
  const name = req.params.name;
  const { status, data } = await callApi(req, `/api/pets/${encodeURIComponent(name)}`);

  if (status === 200 && data?.payload) {
    return res.render('demo-pet', {
      title: `Mascota: ${data.payload.name}`,
      pet: data.payload
    });
  }
  return res.status(status).render('error', {
    title: 'Mascota no encontrada',
    code: status,
    message: data?.message || 'Mascota no encontrada'
  });
});

/** AUTHENTICATED: /demo/private
 *  Envuelve GET /private/ping y renderiza HTML con info de sesión.
 */
router.get('/demo/private', async (req, res) => {
  const { status, data } = await callApi(req, '/private/ping');

  if (status === 200 && data?.payload) {
    return res.render('demo-private', {
      title: 'Zona autenticada',
      message: data.payload.message,
      user: data.payload.user
    });
  }
  const msg = status === 401 ? 'Necesitás iniciar sesión' : (data?.message || 'Acceso restringido');
  return res.status(status).render('error', { title: 'Acceso', code: status, message: msg });
});




/** GET /demo/admin — vista SSR que consulta /private/admin-ping (requiere rol ADMIN)
 *  IMPORTANTE: reenviamos la cookie del request SSR en el header "cookie"
 *  para que el endpoint interno vea el JWT (HttpOnly).
 */
router.get('/demo/admin', ensureAuthedView, async (req, res) => {
  try {
    const base = `${req.protocol}://${req.get('host')}`;
    const r = await fetch(`${base}/private/admin-ping`, {
      headers: { cookie: req.headers.cookie || '' }
    });

    const data = await r.json().catch(() => ({}));

    // ok=true si el endpoint respondió 2xx
    return res.render('demo-admin', {
      title: 'Panel ADMIN',
      ok: r.ok,
      status: r.status,
      payload: data?.payload,
      user: req.user
    });
  } catch (err) {
    return res.render('demo-admin', {
      title: 'Panel ADMIN',
      ok: false,
      status: 500,
      user: req.user
    });
  }
});
export default router;


/* -----------------------------------------------------------------------------
🧪 Pruebas rápidas (navegador):

1) Sin cookie:
   - GET /              → redirige a /login
   - GET /current       → redirige a /login?error=Login%20required
   - GET /demo/pets/Milo→ renderiza (público)
   - GET /demo/private  → renderiza error 401 “Necesitás iniciar sesión”
   - GET /demo/admin    → 401 o 403 según corresponda

2) Con cookie válida (USER):
   - GET /              → /current
   - GET /demo/private  → OK (HTML con email/rol)
   - GET /demo/admin    → 403 “Se requiere rol ADMIN”

3) Con cookie válida (ADMIN):
   - GET /demo/admin    → OK (HTML “pong (admin)”)


----------------------------------------------------------------------------- */
