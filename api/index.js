// index.js — Vercel Serverless Entry

import { connectPostgres, sequelize } from '../db';
import { connectMongo } from '../config/mongo';
import app from '../app';

let isConnected = false;

export default async function handler(req, res) {
  try {
    // Avoid reconnecting on every request (serverless re-use optimization)
    if (!isConnected) {
      await connectPostgres();
      console.log("Postgres connected");

      await connectMongo();
      console.log("Mongo connected");

      await sequelize.sync();
      console.log("Sequelize models synced");

      isConnected = true;
    }

    // Run Express app inside Vercel function adapter
    return new Promise((resolve, reject) => {
      app(req, res, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });

  } catch (err) {
    console.error("Index.js handler error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}
