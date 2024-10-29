// CursosTeologicos.js
const { DataTypes } = require('sequelize');
const sequelize = require('../database/database');
const Membros = require('../membro/Membro');
const Departamento = require("./Departamento");

const departamentoMembros = sequelize.define('dptmembros', {
 
});




Membros.hasMany(departamentoMembros);
Departamento.hasMany(departamentoMembros);

module.exports = departamentoMembros;
