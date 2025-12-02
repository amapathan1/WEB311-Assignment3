// api/index.js - CORRECTED VERSION (CommonJS)
const { connectPostgres, getSequelize } = require('./db');
const { connectMongo } = require('./config/mongo');
const app = require('./app');

let isConnected = false;

module.exports = async function handler(req, res) {
  try {
    // Only connect on cold start
    if (!isConnected) {
      console.log("Cold start - initializing databases...");
      
      // Connect to PostgreSQL with timeout
      await Promise.race([
        connectPostgres(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('PostgreSQL connection timeout')), 5000)
        )
      ]);
      
      // Connect to MongoDB with timeout
      await Promise.race([
        connectMongo(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('MongoDB connection timeout')), 5000)
        )
      ]);
      
      // Sync Sequelize models (skip in production to avoid auto-creating tables)
      if (process.env.NODE_ENV !== 'production') {
        const sequelize = getSequelize();
        await sequelize.sync();
        console.log("Sequelize models synced");
      }
      
      isConnected = true;
      console.log("All databases connected and ready");
    }

    // Handle the request
    return app(req, res);
  } catch (err) {
    console.error("Serverless handler error:", err);
    
    // Return user-friendly error page
    if (!res.headersSent) {
      if (req.headers.accept && req.headers.accept.includes('text/html')) {
        res.status(500).send(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Server Error</title>
              <style>
                body { font-family: sans-serif; padding: 40px; text-align: center; }
                h1 { color: #dc3545; }
                .error-details { 
                  display: ${process.env.NODE_ENV === 'development' ? 'block' : 'none'};
                  background: #f8f9fa; 
                  padding: 20px; 
                  margin: 20px 0; 
                  border-radius: 5px; 
                  text-align: left;
                  font-family: monospace;
                }
              </style>
            </head>
            <body>
              <h1>500 - Server Error</h1>
              <p>Sorry, something went wrong. Please try again later.</p>
              ${process.env.NODE_ENV === 'development' ? 
                `<div class="error-details">
                  <strong>Error:</strong> ${err.message}<br>
                  <strong>Time:</strong> ${new Date().toISOString()}
                </div>` : ''}
              <p><a href="/">Go to homepage</a></p>
            </body>
          </html>
        `);
      } else {
        res.status(500).json({ 
          error: "Internal server error",
          message: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
      }
    }
  }
};