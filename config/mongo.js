// config/mongo.js
const mongoose = require('mongoose');
require('dotenv').config();

async function connectMongo() {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/web322';
  await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
  console.log('MongoDB connected');
}

module.exports = { connectMongo };
