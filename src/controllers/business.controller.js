import { businessDao } from '../dao/business.dao.js';

// GET /api/business
export const getBusiness = async (req, res) => {
  try {
    const business = await businessDao.getBusiness();
    res.json({ status: 'success', result: business });
  } catch (err) {
    res.status(500).json({ status: 'error', error: err.message });
  }
};

// POST /api/business
export const createBusiness = async (req, res) => {
  try {
    const business = await businessDao.createBusiness(req.body);
    res.status(201).json({ status: 'success', result: business });
  } catch (err) {
    res.status(500).json({ status: 'error', error: err.message });
  }
};

// GET /api/business/:id
// Obtiene un negocio puntual por su _id
export const getBusinessById = async (req, res) => {
  try {
    const { id } = req.params;

    const business = await businessDao.getBusinessById(id);
    if (!business) {
      return res
        .status(404)
        .json({ status: 'error', error: 'Negocio no encontrado' });
    }

    res.json({ status: 'success', result: business });
  } catch (err) {
    res.status(500).json({ status: 'error', error: err.message });
  }
};

// POST /api/business/:id/products
// Agrega un producto a la carta de un negocio
export const addProduct = async (req, res) => {
  try {
    const { id } = req.params; // id del negocio
    const productData = req.body; // { id, name, price }

    const updatedBusiness = await businessDao.addProduct(id, productData);

    if (!updatedBusiness) {
      return res
        .status(404)
        .json({ status: 'error', error: 'Negocio no encontrado' });
    }

    res.json({ status: 'success', result: updatedBusiness });
  } catch (err) {
    res.status(500).json({ status: 'error', error: err.message });
  }
};

