// Carga variables de entorno, conecta a Mongo y levanta HTTP.
// Mantener este archivo pequeño y de responsabilidad única.

import 'dotenv/config';
import mongoose from 'mongoose';
import app from './src/app.js';
import { config } from './src/config/config.js';

const { MONGO_URL, MONGO_DB = 'integrative_practice', PORT = 3000 } = process.env;

await mongoose.connect(MONGO_URL, { dbName: MONGO_DB });
console.log(`Mongo conectado (${MONGO_DB})`);

const server = app.listen(PORT, () => {
  console.log(`API escuchando en http://localhost:${PORT}`);
});

process.on('SIGINT', async () => {
  console.log('\n👋 Cerrando…');
  await mongoose.disconnect();
  server.close(() => process.exit(0));
});
