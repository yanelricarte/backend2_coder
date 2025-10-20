/**
 * Modelo de Usuario con:
 * - Hash de password en pre('save') (si el password fue modificado)
 * - Método de instancia comparePassword(plain) → boolean
 * - Índice único en email
 *
 * Importante:
 * - El hash se hace acá (modelo), no en la ruta. La ruta simplemente pasa "password" plano.
 * - comparePassword usa bcryptjs.compare para validar en login.
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const ROUNDS = Number(process.env.BCRYPT_ROUNDS ?? 10);

const UserSchema = new mongoose.Schema(
  {
    name:   { type: String, required: true },
    age:    { type: Number, required: true },
    email:  { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true }, // guardamos HASH, no texto plano
    role:   { type: String, enum: ['user', 'admin'], default: 'user' }
  },
  { timestamps: true }
);

/**
 * Hash de password si fue modificado.
 * Nota: si el campo password no cambió, NO re-hasheamos.
 */
UserSchema.pre('save', async function (next) {
  try {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, ROUNDS);
    next();
  } catch (err) {
    next(err);
  }
});

/**
 * Método de instancia para validar password en login.
 * @param {string} plainPassword - password en texto plano provisto por el usuario
 * @returns {Promise<boolean>}
 */
UserSchema.methods.comparePassword = function (plainPassword) {
  return bcrypt.compare(plainPassword, this.password);
};

export default mongoose.model('User', UserSchema);
