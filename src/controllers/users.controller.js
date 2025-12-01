import UserDAO from '../dao/user.dao.js';

const userDao = new UserDAO();

export const getUsers = async (req, res) => {
  try {
    const users = await userDao.getUsers();
    res.send({ status: 'success', result: users });
  } catch (error) {
    res.status(500).send({ status: 'error', error: error.message });
  }
};
// controllers/users.controller.js
export const createUser = async (req, res) => {
  try {
    const { name, email } = req.body;
    const user = await userDao.createUser({ name, email });
    res.status(201).send({ status: 'success', result: user });
  } catch (error) {
    // Caso email duplicado (Mongoose/Mongo)
    if (error.code === 11000) {
      return res.status(400).send({
        status: 'error',
        message: 'El email ya está registrado'
      });
    }

    console.error('[createUser] Error inesperado:', error);
    res.status(500).send({ status: 'error', error: error.message });
  }
};

