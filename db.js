require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.PG_DATABASE || 'web322',
  process.env.PG_USER || 'postgres',
  process.env.PG_PASSWORD || '',
  {
    host: process.env.PG_HOST || 'localhost',
    port: parseInt(process.env.PG_PORT || '5432', 10),
    dialect: 'postgres',
    logging: false
  }
);

async function connectPostgres() {
  try {
    await sequelize.authenticate();
    console.log('PostgreSQL connected successfully!');
  } catch (err) {
    console.error('Postgres connection error:', err);
    throw err;
  }
}

module.exports = { sequelize, connectPostgres };
