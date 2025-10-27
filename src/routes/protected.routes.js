import { Router } from 'express';
const router = Router();

function isAuthenticated(req, res, next) {
  if (req.session?.user) return next();
  return res.status(401).json({ error: 'No autenticado' });
}

/* PING PROTEGIDO: confirma que la barrera funciona sin exponer datos */
router.get('/ping', isAuthenticated, (_req, res) => {
  res.json({ ok: true, msg: 'pong (protegido)' });
});

export default router;

