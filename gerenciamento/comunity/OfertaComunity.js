// Comunity.js
const { DataTypes } = require('sequelize');
const sequelize = require('../database/database');
const Ofertas = require("../Financas/Ofertas");
const comunity = require("./Comunity");


// Definição da tabela Comunity
const ofertacomunity = sequelize.define('ofertacomunity', {
  
});


Ofertas.hasMany(ofertacomunity);
comunity.hasMany(ofertacomunity);

ofertacomunity.belongsTo(Ofertas);

ofertacomunity.belongsTo(comunity);

module.exports = ofertacomunity;
