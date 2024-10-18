const Sequelize = require('sequelize');
const connection = require('../database/database');

const Vendas = connection.define('Sell', {
    typeService: {
        type: Sequelize.STRING,
        allowNull: false
    },
    date: {
        type: Sequelize.DATE,
        allowNull: false
    },
    valor: {
        type: Sequelize.DECIMAL(10, 2)
    },
    serviceCost: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
    },
    metodoPagamento: { // Novo campo para o método de pagamento
        type: Sequelize.STRING,
        allowNull: false
    }
});


 

module.exports = Vendas;
