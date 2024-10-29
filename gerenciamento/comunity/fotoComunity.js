// Comunity.js
const { DataTypes } = require('sequelize');
const sequelize = require('../database/database');

const comunity = require("./Comunity");


// Definição da tabela Comunity
const fotoacomunity = sequelize.define('fotocomunity', {

    foto: {
        type: DataTypes.STRING,
        allowNull: true, // Nome da comunidade não pode ser nulo
      }
  
});



comunity.hasMany(fotoacomunity);



fotoacomunity.belongsTo(comunity);

module.exports = fotoacomunity;
