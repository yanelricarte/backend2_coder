// src/controllers/orders.controller.js
import UserDAO from '../dao/user.dao.js';
import { businessDao } from '../dao/business.dao.js';
import OrderDAO from '../dao/order.dao.js';

const userDao = new UserDAO();
const orderDao = new OrderDAO();

export const getOrders = async (req, res) => {
  try {
    const orders = await orderDao.getOrders();
    res.send({ status: 'success', result: orders });
  } catch (error) {
    res.status(500).send({ status: 'error', error: error.message });
  }
};

export const createOrder = async (req, res) => {
  try {
    const { userId, businessId, products } = req.body;
    // products: [idProducto1, idProducto2, ...]

    const user = await userDao.getUserById(userId);
    const business = await businessDao.getBusinessById(businessId);

    if (!user || !business) {
      return res.status(400).send({
        status: 'error',
        message: 'User o Business no válido'
      });
    }

    const selectedProducts = business.products.filter(p =>
      products.includes(p.id)
    );

    if (selectedProducts.length === 0) {
      return res.status(400).send({
        status: 'error',
        message: 'No hay productos válidos en la orden'
      });
    }

    const totalPrice = selectedProducts.reduce(
      (acc, p) => acc + p.price,
      0
    );

    const newOrderData = {
      number: Date.now(),
      business: business._id,
      user: user._id,
      products: selectedProducts.map(p => ({
        name: p.name,
        price: p.price,
        quantity: 1
      })),
      totalPrice
    };

    const order = await orderDao.createOrder(newOrderData);

    res.status(201).send({ status: 'success', result: order });
  } catch (error) {
    res.status(500).send({ status: 'error', error: error.message });
  }
};
