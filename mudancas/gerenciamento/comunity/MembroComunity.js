// Comunity.js
const { DataTypes } = require('sequelize');
const sequelize = require('../database/database');
const Membros = require("../membro/Membro");
const comunity = require("./Comunity");


// Definição da tabela Comunity
const membrocomunity = sequelize.define('membrocomunity', {
  
});


Membros.hasMany(membrocomunity);
comunity.hasMany(membrocomunity);

membrocomunity.belongsTo(Membros);

membrocomunity.belongsTo(comunity);

module.exports = membrocomunity;
