// Ofertas.js
const { DataTypes } = require('sequelize');
const sequelize = require('../database/database');

const Despesas = sequelize.define('gastos', {
    valor: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    motivo: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    comprovativo: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    origem: {  // Novo campo para a origem da despesa
        type: DataTypes.STRING,
        allowNull: false,
    },
});



module.exports = Despesas;
