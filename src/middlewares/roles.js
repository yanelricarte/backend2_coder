/**
 * Control de acceso por rol.
 * 401 = no autenticado (no hay req.user)
 * 403 = autenticado pero sin permiso (rol no permitido)
 */
/** Control de acceso por rol */
export function allowRoles(...roles) {
  const allowed = roles.map(r => String(r).toLowerCase());
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const role = String(req.user.role || '').toLowerCase();
    if (!allowed.includes(role)) return res.status(403).json({ error: 'Forbidden' });
    next();
  };
}
