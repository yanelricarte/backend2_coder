import dotenv from 'dotenv';
import fs from 'fs';

// --- Cómo resolvemos el modo ---
// Antes: dependíamos sólo de NODE_ENV.
// Ahora: permitimos `--mode`, o NODE_ENV, o 'development' por defecto.
const modeArg = (() => {
  const i = process.argv.indexOf('--mode');
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : null;
})();
const MODE = modeArg || process.env.NODE_ENV || 'development';

// --- Carga del .env por modo con fallback ---
// 1) .env.<MODE> (p. ej., .env.development / .env.production)
// 2) si no existe, .env (compatible con tu repo actual)
const modePath = `.env.${MODE}`;
if (fs.existsSync(modePath)) {
  dotenv.config({ path: modePath });
} else {
  // Comentario: si estabas usando ".env" a secas, esto lo mantiene funcionando.
  dotenv.config({ path: '.env' });
}

// Helper para listas separadas por coma
const parseList = (csv) =>
  (csv ? csv.split(',').map(s => s.trim()).filter(Boolean) : []);

export const config = {
  mode: MODE,
  isProd: MODE === 'production',

  // Server
  port: Number(process.env.PORT || 3000),

  // Mongo
  mongoUri: process.env.MONGO_URI || '',
  mongoDb: process.env.MONGO_DB || 'integrative_practice',

  // Auth / Cookies
  jwtSecret: process.env.JWT_SECRET || 'change-this-jwt',
  jwtExpires: process.env.JWT_EXPIRES || '15m',
  cookieName: process.env.COOKIE_NAME || 'currentUser',
  cookieSecret: process.env.COOKIE_SECRET || 'change-this-cookie',

  // CORS
  corsOrigins: parseList(process.env.CORS_ORIGIN),
};
