// Comunity.js
const { DataTypes } = require('sequelize');
const sequelize = require('../database/database');

// Definição da tabela Comunity
const USER = sequelize.define('usuario2', {
  
  pnome: {
    type: DataTypes.STRING,
    allowNull: false, // Nome da comunidade não pode ser nulo
  },
  unome: {
    type: DataTypes.STRING,
    allowNull: false, // Nome da comunidade não pode ser nulo
  },
  pass: {
    type: DataTypes.STRING,
    allowNull: false, // Nome da comunidade não pode ser nulo
  }
  ,
  type_user: {
    type: DataTypes.STRING,
    allowNull: false, // Nome da comunidade não pode ser nulo
  }
});



module.exports = USER ;
