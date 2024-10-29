// Comunity.js
const { DataTypes } = require('sequelize');
const sequelize = require('../database/database');

// Definição da tabela Comunity
const Comunity = sequelize.define('Comunity', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true, // O campo ID será incrementado automaticamente
  },
  nome: {
    type: DataTypes.STRING,
    allowNull: false, // Nome da comunidade não pode ser nulo
  },
});

module.exports = Comunity;
