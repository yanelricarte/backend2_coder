const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const userRoutes = require('./routes/users.routes');
const errorMW = require('./middlewares/error').default;

const app = express();

// Middlewares
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/users', userRoutes);

//404
app.use((_req, res) => res.status(404).json({ message: 'Ruta no encontrada' }));


// Errores

app.use(errorMW);

module.exports = app;