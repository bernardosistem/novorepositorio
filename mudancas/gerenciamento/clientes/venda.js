const Sequelize = require('sequelize');
const connection = require('../database/database');

const Venda = connection.define('vendap', {
    cliente: {
        type: Sequelize.STRING,
        allowNull: false
    },
    nif: {
        type: Sequelize.STRING, // Considerando que NIF pode ter caracteres e comprimento variável
        allowNull: false
    }
});

// Sincronize o modelo com o banco de dados, se necessário
// Venda.sync({ force: true }); // Usar com cuidado, pois sobrescreve a tabela

module.exports = Venda;
