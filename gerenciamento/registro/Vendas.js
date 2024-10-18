const Sequelize = require('sequelize');
const connection = require('../database/database');
const Clientes = require('../clientes/Clientes');
const Procedimentos = require('../procedimentos/Procedimentos');

const Vendas = connection.define('Vendas', {
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


Clientes.hasMany(Vendas);
Vendas.belongsTo(Clientes, { foreignKey: ' ClienteId' });

Vendas.sync({force:false});

module.exports = Vendas;