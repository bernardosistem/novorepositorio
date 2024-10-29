const { DataTypes } = require('sequelize');
const sequelize = require('./database');
const Produtos = require('../clientes/Produtos'); 
const User = require('./Usuario');

const Usuario = sequelize.define('UserProduto', {
  
});


Produtos.hasMany(Usuario)
User.hasMany(Usuario)





module.exports = Usuario;
