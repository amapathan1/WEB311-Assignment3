// api/index.js - FIXED VERSION
const app = require('./app');

let isInitialized = false;

module.exports = async function handler(req, res) {
  try {
    // Lazy initialization - only on first request
    if (!isInitialized) {
      console.log('Initializing application...');
      
      // Try to connect to databases, but don't crash if they fail
      try {
        const { connectPostgres } = require('./db');
        const { connectMongo } = require('./config/mongo');
        
        // Connect to databases with timeout
        await Promise.race([
          Promise.allSettled([
            connectPostgres(),
            connectMongo()
          ]),
          new Promise(resolve => setTimeout(resolve, 5000))
        ]);
        
        console.log('Database initialization attempted');
      } catch (dbErr) {
        console.warn('Database initialization warning:', dbErr.message);
        // Continue even if databases fail
      }
      
      isInitialized = true;
    }
    
    // Handle the request
    return app(req, res);
    
  } catch (err) {
    console.error('Handler error:', err.message);
    
    // Send a proper error response
    if (!res.headersSent) {
      res.status(500).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Server Error</title>
          <style>
            body { font-family: sans-serif; padding: 40px; text-align: center; }
            h1 { color: #dc3545; }
            .error { background: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 5px; }
          </style>
        </head>
        <body>
          <h1>Server Error</h1>
          <p>Something went wrong. Please try again later.</p>
          <div class="error">
            <strong>Error:</strong> ${err.message}<br>
            <strong>Time:</strong> ${new Date().toISOString()}
          </div>
        </body>
        </html>
      `);
    }
  }
};