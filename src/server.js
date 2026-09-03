require('dotenv').config();

const { connectMySQL } = require('./config/mysql');

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    const requiredEnv = ['PORT', 'DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
    const missing = requiredEnv.filter((key) => !process.env[key]);

    if (missing.length > 0) {
      throw new Error(`Faltan variables de entorno: ${missing.join(', ')}`);
    }

    await connectMySQL();
    console.log('MySQL connection established');

    const app = require('./app');

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

startServer();