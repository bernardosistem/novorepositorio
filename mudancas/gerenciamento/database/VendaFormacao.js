const Sequelize = require('sequelize');
const connection = require('./database');

const Formacao = require("./Formacao");
const Formandos = require("./Formandos");

const VendasFormacao = connection.define('VendasFormacao', {
 
});

// Sincronize o modelo com o banco de dados, se necessário
// VendasFormacao.sync({ force: true }); // Usar com cuidado, pois sobrescreve a tabela

Formacao.hasMany(VendasFormacao);
Formandos.hasMany(VendasFormacao);

module.exports = VendasFormacao;
