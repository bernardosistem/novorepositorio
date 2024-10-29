const Sequelize = require('sequelize');
const connection = require('../database/database');
const Clientes = require('../clientes/Clientes');
const Procedimentos = require('../procedimentos/Procedimentos');

const registro = connection.define('Registro', {
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
});


registro.sync({force:false});

module.exports = registro;