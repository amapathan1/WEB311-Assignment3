// server.js
require('dotenv').config();
const { connectPostgres, sequelize } = require('./db');
const { connectMongo } = require('./config/mongo');
const app = require('./app');

async function start() {
  try {
    await connectPostgres();
    console.log('Postgres connected');

    await connectMongo();
    console.log('Mongo connected');

    await sequelize.sync();
    console.log('Sequelize models synced');

    const port = process.env.PORT || 3000;
    app.listen(port, () => {
      console.log(`Server running locally at http://localhost:${port}`);
    });
  } catch (err) {
    console.error('Startup error:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  start();
}
