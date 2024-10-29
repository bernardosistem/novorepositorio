// Comunity.js
const { DataTypes } = require('sequelize');
const sequelize = require('../database/database');
const Despesas = require("../Financas/Despesas");
const comunity = require("./Comunity");


// Definição da tabela Comunity
const despesacomunity = sequelize.define('despesacomunity', {
  
});


Despesas.hasMany(despesacomunity);
comunity.hasMany(despesacomunity);

despesacomunity.belongsTo(Despesas);

despesacomunity.belongsTo(comunity);

module.exports = despesacomunity;
