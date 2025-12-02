// config/mongo.js - OPTIMIZED FOR VERCEL
const mongoose = require('mongoose');
require('dotenv').config();

let isConnected = false;
let connectionPromise = null;

async function connectMongo() {
  // Return existing connection if available
  if (isConnected && mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }
  
  // If connection is in progress, wait for it
  if (connectionPromise) {
    return connectionPromise;
  }
  
  connectionPromise = (async () => {
    try {
      const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/web322';
      
      // For Vercel production, ensure SSL/TLS
      const options = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 30000,
      };
      
      // Add SSL option for production (like MongoDB Atlas)
      if (uri.includes('mongodb+srv://')) {
        options.tls = true;
        options.tlsAllowInvalidCertificates = false;
      }
      
      await mongoose.connect(uri, options);
      
      isConnected = true;
      console.log('MongoDB connected successfully');
      
      mongoose.connection.on('error', (err) => {
        console.error('MongoDB connection error:', err);
        isConnected = false;
      });
      
      mongoose.connection.on('disconnected', () => {
        console.log('MongoDB disconnected');
        isConnected = false;
      });
      
      return mongoose.connection;
    } catch (err) {
      console.error('MongoDB connection failed:', err);
      isConnected = false;
      connectionPromise = null;
      throw err;
    }
  })();
  
  return connectionPromise;
}

module.exports = { connectMongo };