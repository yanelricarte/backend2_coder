import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { engine } from 'express-handlebars';

import { initPassport } from './config/passport.js';
import sessionsRoutes from './routes/sessions.routes.js';
import viewsRoutes from './routes/views.routes.js';

// (U5) Routers con políticas y ruteo avanzado
import ProtectedRouter from './routes/protected.routes.js';
import PetsRouter from './routes/pets.router.js';
import { attachUserFromCookie } from './middlewares/auth-cookie.js';
import errorMW from './middlewares/error.js';

// ======================
// (U5) Config centralizada
// ======================
// En vez de leer process.env disperso, centralizamos en config.js
import { config } from './config/config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const app = express();

/* Seguridad base — cabeceras protectoras (XSS, MIME sniffing, etc.) */
app.use(helmet({ crossOriginEmbedderPolicy: false }));

app.use(cors({
  origin: config.corsOrigins.length ? config.corsOrigins : true,
  credentials: true // necesario para enviar/recibir cookies cross-site
}));

/* Parsers + logs — logs alineados al entorno (dev/combined) */
app.use(morgan(config.logLevel || 'dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* Cookies firmadas — la firma asegura integridad (no confundir con JWT) */
app.use(cookieParser(config.cookieSecret));

/* Vistas (SSR) + archivos estáticos */
app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, '..', 'public')));

/*  Si hay cookie JWT válida, construimos req.user (disponible en SSR) */
app.use(attachUserFromCookie);

/*  Estrategias Passport (sin sesiones de Passport) */
initPassport(app);

/*  Healthcheck simple para monitoreo y smoke tests */
app.get('/health', (_req, res) => res.json({ ok: true }));

/* Rutas base (U4) — cierre de la unidad 4 */
app.use('/', viewsRoutes);                 // /login, /current (SSR)
app.use('/api/sessions', sessionsRoutes);  // register/login/current/logout (API)

/* Rutas con políticas (U5) — Router personalizado + handlePolicies */
app.use('/private', new ProtectedRouter().getRouter()); // /private/ping (AUTH) /private/admin-ping (ADMIN)
app.use('/api/pets', new PetsRouter().getRouter());     // demo ruteo avanzado + políticas

/* 404 y errores — contrato coherente para front/Postman */
app.use((_req, res) => res.status(404).json({ message: 'Ruta no encontrada' }));
app.use(errorMW);

export default app;

/* ----------------------------------------------------------------------
Notas para la clase:
- (U4) El SSR depende de que attachUserFromCookie corra ANTES de montar viewsRoutes.
- (U5) ProtectedRouter/PetsRouter muestran políticas declarativas (401 vs 403) y
       respuestas estandarizadas (res.sendSuccess/res.sendError).
- (U5) CORS: si usás front en dominio distinto, asegurá whitelist + credentials.
---------------------------------------------------------------------- */