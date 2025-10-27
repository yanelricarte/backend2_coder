import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import passport from './config/passport.js';

import { createSessionMW } from './config/session.js';     //usamos SOLO esta fábrica
import sessionsRoutes from './routes/sessions.routes.js';  
import protectRouter from './routes/protected.routes.js';    
import usersRoutes from './routes/users.routes.js';    


import errorMW from './middlewares/error.js';

const app = express();

/* ===== Orden recomendado de middlewares ===== */
app.use(helmet());
app.use(cors({ origin: true, credentials: true })); // si sólo usás mismo origen, podés simplificar
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(createSessionMW()); // crea/recupera req.session (connect-mongo, etc.)


// 👉 habilitar Passport (en este orden)
app.use(passport.initialize());
app.use(passport.session());      // 👉 enlaza passport con express-session


/* Healthcheck */
app.get('/health', (_req, res) => res.json({ ok: true }));

/* Rutas */
app.use('/api/sessions', sessionsRoutes);  // /register, /login, /me, /logout
app.use('/private', protectRouter);
app.use('/api/users',    usersRoutes);     


/* 404 explícito */
app.use((_req, res) => res.status(404).json({ message: 'Ruta no encontrada' }));

/* Handler de errores (último SIEMPRE) */
app.use(errorMW);

export default app;
