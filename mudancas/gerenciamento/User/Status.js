// Comunity.js
const { DataTypes } = require('sequelize');
const sequelize = require('../database/database');
const Comunidade = require("../comunity/Comunity");
const User = require("./User");

// Definição da tabela Comunity
const status = sequelize.define('status2', {
   
  status: {
    type: DataTypes.STRING,
    allowNull: false, // Nome da comunidade não pode ser nulo
  }
});
 

Comunidade.hasMany(status)
User.hasMany(status);

status.belongsTo(Comunidade)
User.belongsTo(Comunidade)



module.exports = status  ;
