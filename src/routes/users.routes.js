const router = require('express').Router();
const User = require('../models/User');

// GET lista
router.get('/', async (_req, res, next) => {
  try {
    const users = await User.find().lean();
    res.json(users);
  } catch (err) { next(err); }
});

// GET detalle
router.get('/:id', async (req, res, next) => {
  try {
    const u = await User.findById(req.params.id).lean();
    if (!u) return res.status(404).json({ message: 'No encontrado' });
    res.json(u);
  } catch (err) { next(err); }
});

// POST crear
router.post('/', async (req, res, next) => {
  try {
    const { name, age, email } = req.body || {};
    if (!name || age == null || !email)
      return res.status(422).json({ message: 'name, age, email son obligatorios' });

    const user = await User.create({ name, age, email });
    res.status(201).location(`/api/users/${user._id}`).json(user);
  } catch (err) { next(err); }
});

// PUT reemplazo total
router.put('/:id', async (req, res, next) => {
  try {
    const { name, age, email } = req.body || {};
    if (!name || age == null || !email)
      return res.status(422).json({ message: 'name, age, email son obligatorios' });

    const u = await User.findByIdAndUpdate(
      req.params.id,
      { name, age, email },
      { new: true, runValidators: true }
    ).lean();

    if (!u) return res.status(404).json({ message: 'No encontrado' });
    res.json(u);
  } catch (err) { next(err); }
});

// PATCH parcial
router.patch('/:id', async (req, res, next) => {
  try {
    const u = await User.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    ).lean();

    if (!u) return res.status(404).json({ message: 'No encontrado' });
    res.json(u);
  } catch (err) { next(err); }
});

// DELETE eliminar
router.delete('/:id', async (req, res, next) => {
  try {
    const u = await User.findByIdAndDelete(req.params.id).lean();
    if (!u) return res.status(404).json({ message: 'No encontrado' });
    res.status(204).send();
  } catch (err) { next(err); }
});

module.exports = router;
