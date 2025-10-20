// Construye el middleware de sesión usando connect-mongo como store.
// Buenas prácticas: saveUninitialized:false, resave:false, cookie segura.

import session from 'express-session';
import MongoStore from 'connect-mongo';

export function createSessionMW() {
  const { SESSION_SECRET, MONGO_URL, SESSION_TTL_MIN = 30 } = process.env;
  if (!SESSION_SECRET) throw new Error('Falta SESSION_SECRET en .env');

  // Store persistente en Mongo (limpieza por TTL interna)
  const store = MongoStore.create({
    mongoUrl: MONGO_URL,
    ttl: Number(SESSION_TTL_MIN) * 60, // segundos
    autoRemove: 'interval',
    autoRemoveInterval: 10 // cada 10 min limpia expiradas
  });

  // Si desplegás detrás de proxy (ngrok, Nginx, Render), en app.js:
  // app.set('trust proxy', 1) y activá cookie.secure:true cuando uses HTTPS.

  return session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false, // no crear sesión vacía
    store,
    cookie: {
      httpOnly: true,           // inaccesible desde JS del navegador
      sameSite: 'lax',          // protege CSRF básico sin romper navegación normal
      maxAge: Number(SESSION_TTL_MIN) * 60 * 1000 // ms
      // secure: true           // activar si servís por HTTPS
    }
  });
}
