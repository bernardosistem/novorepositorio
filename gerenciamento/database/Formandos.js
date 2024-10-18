const Sequelize = require('sequelize');
const connection = require('./database');

const Formandos = connection.define('Formandos', {
    nome: {
        type: Sequelize.STRING,
        allowNull: false
    },
    telefone: {
        type: Sequelize.STRING,
        allowNull: false
    }
});

// Sincronize o modelo com o banco de dados, se necessário
// Formandos.sync({ force: true }); // Usar com cuidado, pois sobrescreve a tabela

module.exports = Formandos;
