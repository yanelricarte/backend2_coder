/**
 * PASSPORT – Clase 5 (con comentarios de transición)
 * - ❌ Antes: `const { JWT_SECRET, COOKIE_NAME } = process.env`
 * - ✅ Ahora: usamos `config.jwtSecret` y `config.cookieName`
 */

import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';


import { config } from './config.js';

/* Local */
passport.use(
  'local',
  new LocalStrategy(
    { usernameField: 'email', passwordField: 'password', session: false },
    async (email, password, done) => {
      try {
        const norm = String(email).toLowerCase().trim();
        const user = await User.findOne({ email: norm });
        if (!user) return done(null, false, { message: 'Usuario no encontrado' });
        const ok = await bcrypt.compare(password, user.password);
        if (!ok) return done(null, false, { message: 'Contraseña incorrecta' });
        return done(null, { id: String(user._id), email: user.email, role: user.role || 'user' });
      } catch (e) { return done(e); }
    }
  )
);

/* JWT: cookie firmada + Bearer */
const bearer = ExtractJwt.fromAuthHeaderAsBearerToken();
const cookieExtractor = (req) => {
  try {
    return (
      req?.signedCookies?.[config.cookieName] ||
      req?.cookies?.[config.cookieName] ||
      null
    );
  } catch { return null; }
};

passport.use(
  'jwt',
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromExtractors([bearer, cookieExtractor]),
      secretOrKey: config.jwtSecret, // viene del .env cargado por config (con fallback)
      ignoreExpiration: false,
    },
    (payload, done) => {
      try {
        return done(null, {
          id: payload.sub ?? payload.id,
          email: payload.email,
          role: payload.role || 'user',
        });
      } catch (e) { return done(e, false); }
    }
  )
);

export const initPassport = (app) => app.use(passport.initialize());
export default passport;
