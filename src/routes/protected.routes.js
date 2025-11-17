import Router from './router.js';
import { POL, handlePolicies } from '../middlewares/policies.js';


export default class ProtectedRouter extends Router {
  init() {
    // Ruta privada para cualquier usuario autenticado.
    // - Si no hay credencial → 401 "Token requerido"
    this.get('/ping', [handlePolicies([POL.AUTHENTICATED])], (req, res) => {
      return res.sendSuccess({
        message: 'pong (private)',
        user: { id: req.user.id, email: req.user.email, role: req.user.role }
      });
    });

    // Ruta exclusiva ADMIN.
    // - Si hay credencial pero el rol no alcanza → 403 "Acceso denegado"
    this.get('/admin-ping', [handlePolicies([POL.ADMIN])], (_req, res) => {
      return res.sendSuccess({ message: 'pong (admin)' });
    });
  }
}
