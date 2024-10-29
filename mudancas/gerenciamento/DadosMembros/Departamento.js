// CursosTeologicos.js
const { DataTypes } = require('sequelize');
const sequelize = require('../database/database');
const Membros = require('../membro/Membro');

const departamento = sequelize.define('departamento', {
  nomeDepartamento: {
    type: DataTypes.STRING,
    allowNull: false,
  }
});



departamento.belongsTo(Membros);


module.exports = departamento;
