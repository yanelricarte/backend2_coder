import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const ROUNDS = Number(process.env.BCRYPT_ROUNDS ?? 10);

const UserSchema = new mongoose.Schema({
  first_name: { type: String, required: true },
  last_name:  { type: String, required: true },
  age:        { type: Number, required: true },
  email:      { type: String, required: true, unique: true, index: true },
  password:   { type: String, required: true }, // guardamos HASH
  cart:       { type: mongoose.Schema.Types.ObjectId, ref: 'Cart', default: null },
  role:       { type: String, enum: ['user', 'admin'], default: 'user' }
}, { timestamps: true });

UserSchema.pre('save', async function(next) {
  try {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, ROUNDS);
    next();
  } catch (e) { next(e); }
});

export default mongoose.model('User', UserSchema);
