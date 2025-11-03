import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { engine } from 'express-handlebars';

import { initPassport } from './config/passport.js';

import sessionsRoutes from './routes/sessions.routes.js';
import protectRouter from './routes/protected.routes.js';
import usersRoutes from './routes/users.routes.js';
//import viewsRoutes from './routes/views.routes.js';


import { attachUserFromCookie } from './middlewares/auth-cookie.js';
import errorMW from './middlewares/error.js';

const app = express();

/* ===== Orden recomendado de middlewares ===== */
app.use(helmet());
app.use(cors({ origin: true, credentials: true })); // si sólo usás mismo origen, podés simplificar
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* Cookies firmadas; necesarias para leer las cookie desde  req.signedCookies */
app.use(cookieParser(process.env.COOKIE_SECRET));

/* ESTÁTICOS (CSS) */
app.use(express.static('public'));

/* VISTAS (SSR) */
//app.engine('handlebars', engine());
//app.set('view engine', 'handlebars');
//app.set('views', './src/views');


// Passport stateless (NO passport.sesion())

initPassport(app)
app.use(attachUserFromCookie);


/* SALUD + RUTAS */
app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/api/sessions', sessionsRoutes);  // /register, /login, /me, /logout
app.use('/private', protectRouter);
//app.use('//', viewsRoutes);


/* 404 explícito */
app.use((_req, res) => res.status(404).json({ message: 'Ruta no encontrada' }));

/* Handler de errores (último SIEMPRE) */
app.use(errorMW);

export default app;
