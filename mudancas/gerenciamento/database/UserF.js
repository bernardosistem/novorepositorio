const { DataTypes } = require('sequelize');
const sequelize = require('./database');
const Formacao = require('./Formacao'); 
const User = require('./Usuario');

const Usuario = sequelize.define('UserFormacao', {
  
});


Formacao.hasMany(Usuario)
User.hasMany(Usuario)





module.exports = Usuario;
