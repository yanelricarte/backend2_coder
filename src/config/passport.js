import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import User from '../models/User.js';

/**
 * Estrategia Local:
 * - usernameField: 'email' (Passport toma req.body.email)
 * - passwordField: 'password' (Passport toma req.body.password)
 * Hace: findOne + comparePassword. Devuelve (err, user|false).
 */
passport.use(
  new LocalStrategy(
    { usernameField: 'email', passwordField: 'password' },
    async (email, password, done) => {
      try {
        console.log('[PASS] intento', { email });
        const normEmail = String(email).toLowerCase().trim();

        const user = await User.findOne({ email: normEmail });
        if (!user) {
          console.log('[PASS] fail', { reason: 'email_not_found', email: normEmail });
          return done(null, false);
        }

        const ok = await user.comparePassword(password);
        if (!ok) {
          console.log('[PASS] fail', { reason: 'bad_password', email: normEmail });
          return done(null, false);
        }

        console.log('[PASS] ok', { id: user._id.toString(), email: user.email, role: user.role });
        return done(null, user);
      } catch (err) {
        console.log('[PASS] error', { message: err.message });
        return done(err);
      }
    }
  )
);

/**
 * Integración con la sesión:
 * - serializeUser: qué guarda Passport en la sesión → solo el id (string)
 * - deserializeUser: con ese id, carga un usuario liviano y lo deja en req.user
 */
passport.serializeUser((user, done) => {
  console.log('[PASS] serialize', { id: user._id.toString() });
  done(null, user._id.toString());
});

passport.deserializeUser(async (id, done) => {
  try {
    const u = await User.findById(id).select('name email role').lean();
    console.log('[PASS] deserialize', u ? { id, email: u.email, role: u.role } : { id, missing: true });
    done(null, u || false);
  } catch (err) {
    console.log('[PASS] deserialize_error', { id, message: err.message });
    done(err);
  }
});

export default passport;
