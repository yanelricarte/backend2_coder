
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';

import { createSessionMW } from './config/session.js'; // fábrica → middleware real
import sessionsRoutes from './routes/sessions.routes.js';
import errorMW from './middlewares/error.js';

const app = express();

/* ===== Orden recomendado de middlewares ===== */

app.use(helmet());                                 // cabeceras de seguridad
app.use(cors({ origin: true, credentials: true })); // CORS con credenciales (cookies)
app.use(morgan('dev'));                            // logs HTTP
app.use(express.json());                           // parser JSON
app.use(express.urlencoded({ extended: true }));   // parser urlencoded
app.use(cookieParser());                           // lee cookies (incluye connect.sid)
app.use(createSessionMW());                        // crea/recupera sesiones -> req.session

/* Healthcheck simple */
app.get('/health', (_req, res) => res.json({ ok: true }));

/* Rutas de la clase de hoy */
app.use('/api/sessions', sessionsRoutes);          // /register y /login

/* 404 explícito */
app.use((_req, res) => res.status(404).json({ message: 'Ruta no encontrada' }));

/* Handler de errores (último SIEMPRE) */
app.use(errorMW);

export default app;
