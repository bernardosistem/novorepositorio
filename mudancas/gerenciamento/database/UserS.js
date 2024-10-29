const { DataTypes } = require('sequelize');
const sequelize = require('./database');
const Vendas = require('../registro/Venda'); 
const User = require('./Usuario');

const Usuario = sequelize.define('UserServivo', {
  
});


Vendas.hasMany(Usuario)
User.hasMany(Usuario)





module.exports = Usuario;
