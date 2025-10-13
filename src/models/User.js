const { Schema, model } = require('mongoose');

const UserSchema = new Schema({
  name:  { type: String, required: true, trim: true, minlength: 2 },
  age:   { type: Number, required: true, min: 0, max: 120 },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true }
}, { timestamps: true, versionKey: false });


module.exports = model('User', UserSchema);
