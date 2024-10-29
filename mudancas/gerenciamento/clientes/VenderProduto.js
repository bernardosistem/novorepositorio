const Sequelize = require('sequelize');
const connection = require('../database/database');
const Venda = require('./venda');
const Produto = require('./Produtos');

const VendaProduto = connection.define('vendaproduto', {
    quantidade: {
        type: Sequelize.INTEGER,
        allowNull: false
    }
});

// Definindo as associações
Venda.hasMany(VendaProduto);
Produto.hasMany(VendaProduto);

// Sincronize o modelo com o banco de dados, se necessário
// VendaProduto.sync({ force: true }); // Usar com cuidado, pois sobrescreve a tabela

module.exports = VendaProduto;
