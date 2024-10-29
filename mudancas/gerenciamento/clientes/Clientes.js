// models/Clientes.js
const Sequelize = require('sequelize');
const connection = require('../database/database');
const Vendas = require('../registro/Registro');

const Clientes = connection.define('Clientes', {
    nome: {
        type: Sequelize.STRING,
        allowNull: false
    },
    BI: {
        type: Sequelize.STRING,
        allowNull: false
    },
    bairro: {
        type: Sequelize.STRING,
        allowNull: false
    },
    rua: {
        type: Sequelize.STRING,
        allowNull: false
    },
    data: {
        type: Sequelize.DATE,
        allowNull: false
    },
    procedimento: {
        type: Sequelize.STRING,
        allowNull: false
    },
    pagamento: {
        type: Sequelize.STRING,
        allowNull: false
    },
    contactos: {
        type: Sequelize.STRING,
        allowNull:false
    }

});



module.exports = Clientes;