const Sequelize = require('sequelize');
const connection = require('../database/database');
const Vendas = require('../registro/Venda');
const Procedimentos = require("../procedimentos/Servicos");
const Usuario = require("../database/User");

const Clientes = connection.define('Client', {
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
        allowNull: false
    }
});

Clientes.hasMany(Vendas); // Um cliente pode ter várias vendas
Clientes.belongsTo(Usuario); // Um cliente pertence a um usuário (funcionário do salão)
Clientes.belongsTo(Procedimentos); // Um cliente está associado a um procedimento (ou serviço)

Clientes.hasMany(Vendas);
Procedimentos.hasMany(Vendas);


module.exports = Clientes;
