import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

const { JWT_SECRET, COOKIE_NAME = 'currentUser' } = process.env;

/* Local: valida email/password y devuelve un payload mínimo */
passport.use('local', new LocalStrategy(
  { usernameField: 'email', passwordField: 'password', session: false },
  async (email, password, done) => {
    try {
      const norm = String(email).toLowerCase().trim();
      const user = await User.findOne({ email: norm });
      if (!user) return done(null, false, { message: 'Usuario no encontrado' });

      const ok = await bcrypt.compare(password, user.password);
      if (!ok) return done(null, false, { message: 'Contraseña incorrecta' });

      return done(null, { id: String(user._id), email: user.email, role: user.role || 'user' });
    } catch (e) {
      return done(e);
    }
  }
));

/* JWT: lee Bearer y/o cookie firmada */
const bearer = ExtractJwt.fromAuthHeaderAsBearerToken();
const cookieExtractor = (req) =>
  req?.signedCookies?.[COOKIE_NAME] || req?.cookies?.[COOKIE_NAME] || null;

passport.use('jwt', new JwtStrategy(
  { jwtFromRequest: ExtractJwt.fromExtractors([bearer, cookieExtractor]), secretOrKey: JWT_SECRET },
  (payload, done) => {
    try { return done(null, { id: payload.sub, email: payload.email, role: payload.role }); }
    catch (e) { return done(e, false); }
  }
));

export const initPassport = (app) => app.use(passport.initialize());
export default passport;
