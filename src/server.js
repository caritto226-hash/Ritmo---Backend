require('dotenv').config();

const app = require('./app');
const { testConnection } = require('./config/db');

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    const requiredEnv = ['PORT', 'DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
    const missing = requiredEnv.filter((key) => !process.env[key]);

    if (missing.length > 0) {
      throw new Error(`Faltan variables de entorno: ${missing.join(', ')}`);
    }

    await testConnection();
    console.log('Database connection successful');

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

startServer();