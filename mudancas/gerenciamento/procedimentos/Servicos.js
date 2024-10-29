const Sequelize = require('sequelize');
const connection = require('../database/database');
const Vendas = require('../registro/Venda');// Importe aqui, se não estiver importado

const Procedimentos = connection.define('Servicos',{
    title : {
        type: Sequelize.STRING,
        allowNull: false
    },
    preco: {
        type: Sequelize.DECIMAL,
        allowNull: false
    }
});





module.exports = Procedimentos;
