import { Router as ExpressRouter } from 'express';

export default class Router {
  constructor() {
    this.router = ExpressRouter();
    this.init(); // Cada subclase define sus rutas acá
  }

  // Subclases deben sobreescribir este método
  // Ej.: init() { this.get('/ping', [handlePolicies([AUTHENTICATED])], ctrl.ping); }
  init() {}

  // Para montar en app.js: app.use('/base', new MiRouter().getRouter())
  getRouter() { return this.router; }

  // ------------------------------------------------------------
  // (1) Respuestas estandarizadas
  // ------------------------------------------------------------
  generateCustomResponses = (_req, res, next) => {
    /**
     * Enviar éxito con un contrato uniforme.
     * @param {any} payload  Datos de negocio
     * @param {number} status Código HTTP (por defecto 200)
     */
    res.sendSuccess = (payload, status = 200) =>
      res.status(status).send({ status: 'success', payload });

    /**
     * Enviar error con un contrato uniforme.
     * @param {string|object} message Mensaje o detalle del error
     * @param {number} status  Código HTTP (por defecto 400)
     */
    res.sendError = (message = 'Bad request', status = 400) =>
      res.status(status).send({ status: 'error', message });

    return next();
  };

  // ------------------------------------------------------------
  // (2) try/catch centralizado
  //    Envuelve cada handler para capturar errores async/sync.
  // ------------------------------------------------------------
  applyCallbacks(callbacks) {
    return callbacks.map(cb => async (req, res, next) => {
      try {
        await cb(req, res, next);
      } catch (err) {
        // Si algún middleware ya envió respuesta, delegamos al error handler global
        if (res.headersSent) return next(err);
        console.error('[Router error]', err);
        return res.status(500).send({ status: 'error', message: 'Internal server error' });
      }
    });
  }

  // ------------------------------------------------------------
  // (3) Mini-DSL: métodos HTTP
  //    Firma: method(path, policies, ...handlers)
  //    - "policies" puede ser un middleware o un array de middlewares.
  //    - "...handlers" son tus controladores (se envuelven con try/catch).
  // ------------------------------------------------------------
  get(path, policies, ...cbs)    { this.#reg('get',    path, policies, cbs); }
  post(path, policies, ...cbs)   { this.#reg('post',   path, policies, cbs); }
  put(path, policies, ...cbs)    { this.#reg('put',    path, policies, cbs); }
  delete(path, policies, ...cbs) { this.#reg('delete', path, policies, cbs); }

  // Registro interno de la ruta con el pipeline completo
  #reg(method, path, policies, cbs) {
    // Normalizamos "policies": puede venir como función o array
    const policiesArray =
      typeof policies === 'function' ? [policies] :
      Array.isArray(policies)       ? policies   :
      []; // si viene null/undefined, no aplicamos políticas

    // Pipeline final = helpers de respuesta + políticas + handlers con try/catch
    const pipeline = [
      this.generateCustomResponses,
      ...policiesArray,
      ...this.applyCallbacks(cbs)
    ];

    this.router[method](path, pipeline);
  }
}
