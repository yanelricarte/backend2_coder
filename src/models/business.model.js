// src/models/business.model.js

// Importamos mongoose para definir el esquema y el modelo
import mongoose from 'mongoose';

// Nombre de la colección en Mongo
const businessCollection = 'businesses';

// Sub–esquema para los productos que ofrece el negocio
// Usamos _id: false para que no genere un ObjectId por cada producto
const productSubSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true
    }
  },
  { _id: false }
);

// Esquema del negocio (Veggie Food u otros)
// Cada negocio tiene un nombre y una lista de productos
const businessSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    products: {
      type: [productSubSchema],
      default: []
    }
  },
  {
    timestamps: true // createdAt / updatedAt
  }
);

// Exportamos el modelo para usarlo en el DAO
export const businessModel = mongoose.model(businessCollection, businessSchema);
