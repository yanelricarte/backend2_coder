import { Router } from 'express';
import {
  getBusiness,
  createBusiness,
  getBusinessById,
  addProduct
} from '../controllers/business.controller.js';

const router = Router();

// GET /api/business        → lista todos los negocios
router.get('/', getBusiness);

// GET /api/business/:id    → devuelve un negocio puntual
router.get('/:id', getBusinessById);

// POST /api/business       → crea un nuevo negocio
router.post('/', createBusiness);

// POST /api/business/:id/products → agrega un producto a ese negocio
router.post('/:id/products', addProduct);

export default router;
