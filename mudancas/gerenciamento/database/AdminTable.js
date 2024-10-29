const { DataTypes } = require('sequelize');
const sequelize = require('./database');
const Vendas = require('../registro/Venda'); // Importe aqui, se não estiver importado

const Usuario = sequelize.define('admin', {
    nome: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    telefone: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    senha: {
        type: DataTypes.STRING,
        allowNull: false,
    }
});






module.exports = Usuario;
