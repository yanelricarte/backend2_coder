import mongoose from 'mongoose';

const userCollection = 'users';

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  role: { type: String, default: 'user' }
});

export const userModel = mongoose.model(userCollection, userSchema);
