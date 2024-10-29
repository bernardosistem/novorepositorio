const Sequelize = require('sequelize');
const connection = require('../database/database');

const Produtos = connection.define('Produtos', {
    nome: {
        type: Sequelize.STRING,
        allowNull: false
    },
    preco: {
        type: Sequelize.DECIMAL(10, 2), // Usar DECIMAL com precisão e escala
        allowNull: false
    },
    quantidade: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    fatura: {
        type: Sequelize.STRING, // Usar STRING para armazenar o caminho do arquivo
        allowNull: true // Se não for obrigatório, pode ser true
    }
});

// Sincronize o modelo com o banco de dados, se necessário
// Produtos.sync({ force: true }); // Usar com cuidado, pois sobrescreve a tabela

module.exports = Produtos;
