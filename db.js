const { Sequelize } = require('sequelize');

module.exports = new Sequelize(
  'telega_bot',
  'root',
  'root',
  {
    host:
    port: '6432',
    dialect: 'postgres'
  }
)