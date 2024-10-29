// Comunity.js
const { DataTypes } = require('sequelize');
const sequelize = require('../database/database');
const Dizimos = require("../Financas/Dizimos");
const comunity = require("./Comunity");


// Definição da tabela Comunity
const dizimocomunity = sequelize.define('dizimocomunity', {
  
});


Dizimos.hasMany(dizimocomunity);
comunity.hasMany(dizimocomunity);

dizimocomunity.belongsTo(Dizimos);

dizimocomunity.belongsTo(comunity);

module.exports = dizimocomunity;
