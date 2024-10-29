const Sequelize = require('sequelize');
const connection = require('./database');

const Formacoes = connection.define('Formacoes', {
    nome: {
        type: Sequelize.STRING,
        allowNull: false
    },
    valor: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
    }
});

// Sincronize o modelo com o banco de dados, se necessário
// Formacoes.sync({ force: true }); // Usar com cuidado, pois sobrescreve a tabela

module.exports = Formacoes;
