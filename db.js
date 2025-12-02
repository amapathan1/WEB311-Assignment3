// db.js - FIXED VERSION
require('dotenv').config();
const { Sequelize } = require('sequelize');

// Try to require pg, if it fails, show a better error
let pg;
try {
  pg = require('pg');
} catch (err) {
  console.error('PG MODULE ERROR:', err.message);
  console.error('Make sure pg is installed: npm install pg');
  // Create a dummy pg object to prevent immediate crash
  pg = { Client: class Client {} };
}

let sequelize;
let isConnected = false;

function getSequelize() {
  if (!sequelize) {
    sequelize = new Sequelize(
      process.env.PG_DATABASE || 'web322',
      process.env.PG_USER || 'postgres',
      process.env.PG_PASSWORD || '',
      {
        host: process.env.PG_HOST || 'localhost',
        port: parseInt(process.env.PG_PORT || '5432', 10),
        dialect: 'postgres',
        logging: false,
        // Add dialect options for better compatibility
        dialectOptions: {
          ssl: process.env.PG_SSL === 'true' ? {
            require: true,
            rejectUnauthorized: false
          } : false
        },
        // Connection pool settings for serverless
        pool: {
          max: 2,
          min: 0,
          acquire: 30000,
          idle: 10000
        }
      }
    );
  }
  return sequelize;
}

async function connectPostgres() {
  // Don't try to connect if pg is not available
  if (!process.env.PG_HOST || !process.env.PG_DATABASE) {
    console.warn('PostgreSQL connection skipped: No environment variables set');
    return;
  }
  
  const db = getSequelize();
  try {
    await db.authenticate();
    console.log('PostgreSQL connected successfully!');
    isConnected = true;
  } catch (err) {
    console.error('Postgres connection error:', err.message);
    // Don't throw, just log - this allows app to start without PostgreSQL
    console.warn('Continuing without PostgreSQL connection');
  }
}

module.exports = {
  getSequelize,
  connectPostgres,
  sequelize: getSequelize()
};