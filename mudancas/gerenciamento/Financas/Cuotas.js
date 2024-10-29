// Quotas.js
const { DataTypes } = require('sequelize');
const sequelize = require('../database/database');
const Departamento = require('../DadosMembros/Departamento');

const Quotas = sequelize.define('cuotas', {
    valor: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    descricao: {
        type: DataTypes.TEXT,
        allowNull: true,
    }
});

// Definindo o relacionamento com a tabela Departamento
Departamento.hasMany(Quotas);
Quotas.belongsTo(Departamento);

module.exports = Quotas;
