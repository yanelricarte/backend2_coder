import { Router } from 'express';
import User from '../models/User.js';

const router = Router();

/* ---------- Middlewares de protección ---------- */
function isAuthenticated(req, res, next) {
  if (req.session?.user) return next();
  return res.status(401).json({ error: 'No autenticado' });
}

function authorize(role) {
  return (req, res, next) => {
    if (!req.session?.user) return res.status(401).json({ error: 'No autenticado' });
    if (req.session.user.role !== role) {
      return res.status(403).json({ error: 'Prohibido: requiere rol ' + role });
    }
    next();
  };
}

/* ---------- /api/users/me (protegido, lee DESDE DB) ---------- */
// Nota: si la sesión no tiene id (caso AdminCoder backdoor), informamos 400 claro.
router.get('/me', isAuthenticated, async (req, res, next) => {
  try {
    const id = req.session.user?.id;
    if (!id) {
      return res.status(400).json({
        error: 'Sesión sin id: este endpoint lee desde DB. Logueate con un usuario real.'
      });
    }
    const user = await User.findById(id).select('name email role age').lean();
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json({ user });
  } catch (err) { next(err); }
});

/* ---------- CRUD (lista/detalle/alta/edición/baja) ---------- */

// GET lista (solo admin)
router.get('/', isAuthenticated, authorize('admin'), async (_req, res, next) => {
  try {
    const users = await User.find().select('name email role age').lean();
    res.json({ users });
  } catch (err) { next(err); }
});

// GET detalle (autenticado)
router.get('/:id', isAuthenticated, async (req, res, next) => {
  try {
    const u = await User.findById(req.params.id).select('name email role age').lean();
    if (!u) return res.status(404).json({ message: 'No encontrado' });
    res.json(u);
  } catch (err) { next(err); }
});

// POST crear (solo admin)
router.post('/', isAuthenticated, authorize('admin'), async (req, res, next) => {
  try {
    const { name, age, email, password, role } = req.body || {};
    if (!name || age == null || !email || !password) {
      return res.status(422).json({ message: 'name, age, email, password son obligatorios' });
    }
    // Se usará el hash del modelo (pre('save'))
    const user = await User.create({ name, age, email, password, role: role || 'user' });
    res.status(201).location(`/api/users/${user._id}`).json({
      id: user._id, name: user.name, email: user.email, role: user.role, age: user.age
    });
  } catch (err) { next(err); }
});

// PUT reemplazo total (solo admin)
router.put('/:id', isAuthenticated, authorize('admin'), async (req, res, next) => {
  try {
    const { name, age, email, role } = req.body || {};
    if (!name || age == null || !email) {
      return res.status(422).json({ message: 'name, age, email son obligatorios' });
    }
    const u = await User.findByIdAndUpdate(
      req.params.id,
      { name, age, email, role },
      { new: true, runValidators: true }
    ).select('name email role age').lean();

    if (!u) return res.status(404).json({ message: 'No encontrado' });
    res.json(u);
  } catch (err) { next(err); }
});

// PATCH parcial (solo admin)
router.patch('/:id', isAuthenticated, authorize('admin'), async (req, res, next) => {
  try {
    const allowed = ['name', 'age', 'email', 'role']; // nunca permitas password acá
    const $set = Object.fromEntries(Object.entries(req.body || {}).filter(([k]) => allowed.includes(k)));

    const u = await User.findByIdAndUpdate(
      req.params.id,
      { $set },
      { new: true, runValidators: true }
    ).select('name email role age').lean();

    if (!u) return res.status(404).json({ message: 'No encontrado' });
    res.json(u);
  } catch (err) { next(err); }
});

// DELETE eliminar (solo admin)
router.delete('/:id', isAuthenticated, authorize('admin'), async (req, res, next) => {
  try {
    const u = await User.findByIdAndDelete(req.params.id).lean();
    if (!u) return res.status(404).json({ message: 'No encontrado' });
    res.status(204).send();
  } catch (err) { next(err); }
});

export default router;
