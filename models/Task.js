const { DataTypes } = require('sequelize');
const { getSequelize } = require('../db');

const sequelize = getSequelize();

const Task = sequelize.define('Task', {
  title: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT },
  dueDate: { type: DataTypes.DATE, allowNull: true },
  status: { type: DataTypes.STRING, defaultValue: 'pending' },
  userId: { type: DataTypes.STRING, allowNull: false }
}, {
  tableName: 'tasks'
});

module.exports = Task;
