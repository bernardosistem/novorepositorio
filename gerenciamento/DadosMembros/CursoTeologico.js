// CursosTeologicos.js
const { DataTypes } = require('sequelize');
const sequelize = require('../database/database');
const Membros = require('../membro/Membro');

const CursosTeologicos = sequelize.define('CursosTeologicos', {
  curso_medio: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  instituicao_ensino: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  ano: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
});



Membros.hasMany(CursosTeologicos);~
CursosTeologicos.belongsTo(Membros);

module.exports = CursosTeologicos;
