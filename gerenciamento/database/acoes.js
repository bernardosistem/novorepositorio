const Sequelize = require('sequelize');
const connection = require('./database');
const Usuario = require('./User'); // Certifique-se de que o caminho está correto

const Atividades = connection.define('acao', {
  
    totalVendas: {
        type: Sequelize.INTEGER,
        defaultValue: 0
    },
    totalAtualizacoesServicos: {
        type: Sequelize.INTEGER,
        defaultValue: 0
    }
});

Usuario.hasMany(Atividades);

Atividades.sync();

module.exports = Atividades;
