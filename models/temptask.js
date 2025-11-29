// models/task.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../db');

const Task = sequelize.define('Task', {
  title: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT },
  dueDate: { type: DataTypes.DATE, allowNull: true },
  status: { type: DataTypes.STRING, defaultValue: 'pending' },
  userId: { type: DataTypes.STRING, allowNull: false } // stores MongoDB user _id as string
}, {
  tableName: 'tasks'
});

module.exports = Task;
