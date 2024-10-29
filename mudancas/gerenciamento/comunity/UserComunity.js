// Comunity.js
const { DataTypes } = require('sequelize');
const sequelize = require('../database/database');
const user = require("../User/User");
const comunity = require("./Comunity");


// Definição da tabela Comunity
const usertacomunity = sequelize.define('usuario2comunity', {
  
});


user.hasMany(usertacomunity);
comunity.hasMany(usertacomunity);

usertacomunity.belongsTo(user);

usertacomunity.belongsTo(comunity);

module.exports = usertacomunity;
