// models/Agendamentos.js
const Sequelize = require('sequelize');
const connection = require('../database/database');
const Procedimentos = require('../procedimentos/Procedimentos');
const Clientes = require('../clientes/Clientes');

const Agendamentos = connection.define('Agendamentos', {
    date: {
        type: Sequelize.DATE,
        allowNull: false
    },
    procedimentoId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
            model: Procedimentos,
            key: 'id'
        }
    },
    clienteId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
            model: Clientes,
            key: 'id'
        }
    },
    // Outros campos relacionados ao agendamento, se houver
});

Agendamentos.associate = (models) => {
    Agendamentos.belongsTo(models.Procedimentos, { foreignKey: 'procedimentoId' });
    Agendamentos.belongsTo(models.Clientes, { foreignKey: 'clienteId' });
};

module.exports = Agendamentos;
