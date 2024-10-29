// Usuario.js
const { DataTypes } = require('sequelize');
const sequelize = require('./database');

const Usuario = sequelize.define('Usuario', {
  nome: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  telefone: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  
  senha: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  }
});



module.exports = Usuario;
