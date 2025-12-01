import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';

// Routers
import usersRouter from './src/routes/users.router.js';
import businessRouter from './src/routes/business.router.js';
import ordersRouter from './src/routes/orders.router.js';

const app = express();

// ===== Middlewares básicos =====
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===== CORS =====
app.use(cors({
  origin: ['http://localhost:5500', 'http://127.0.0.1:5500'],
  methods: ['GET', 'POST', 'PUT', 'DELETE']
}));


// ===== Routers base =====
app.use('/api/users', usersRouter);
app.use('/api/business', businessRouter);
app.use('/api/orders', ordersRouter);

// ===== Conexión a MongoDB  =====
const MONGO_URL = process.env.MONGO_URL;

mongoose.connect(MONGO_URL)
  .then(() => {
    console.log('Conectado a MongoDB');
    app.listen(8080, () => {
      console.log('Servidor escuchando en http://localhost:8080');
    });
  })
  .catch(err => {
    console.error('Error al conectar a MongoDB', err);
  });
