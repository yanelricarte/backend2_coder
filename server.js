require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./src/app');

const PORT = process.env.PORT || 3000;

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
    console.log('Mongo Atlas conectado');

    app.listen(PORT, () => {
      console.log(`API escuchando en htpps://localhost:${PORT}`);
    });
    process.on('SINGTINT', async () => {
      await mongoose.disconnect();
      console.log('\n Cerrando...');
      process.exit(0);
    });
  } catch (err) {
    console.error('Error al iniciar: ', err.message);
    process.exit(1);
  }
})();