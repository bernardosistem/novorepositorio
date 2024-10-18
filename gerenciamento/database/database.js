// sequelize.js
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
  dialect: 'mysql',
  host: 'localhost',
  username: 'root',
  password: '12345678',
  database: 'sistemaigreja'  // Nome da sua base de dados,
  
});

module.exports = sequelize;
