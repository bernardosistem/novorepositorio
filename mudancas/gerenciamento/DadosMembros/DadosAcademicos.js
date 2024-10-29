// DadosAcademicos.js
const { DataTypes } = require('sequelize');
const sequelize = require('../database/database');
const Membros = require('../membro/Membro');

const DadosAcademicos = sequelize.define('DadosAcademicos', {
  habilitacoes_academicas: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  curso: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  especialidade: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  ano: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
});



Membros.hasMany(DadosAcademicos);
DadosAcademicos.belongsTo(Membros);

module.exports = DadosAcademicos;
