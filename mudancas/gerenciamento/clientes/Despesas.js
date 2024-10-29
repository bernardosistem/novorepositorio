const { DataTypes } = require('sequelize');
const sequelize = require('../database/database'); // Ajuste conforme o caminho da sua configuração

const Despesa = sequelize.define('Despesa', {
    tipoDespesa: {
        type: DataTypes.STRING,
        allowNull: false
    },
    valor: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    comprovativo: {
        type: DataTypes.STRING, // Nome do arquivo do comprovativo
        allowNull: true
    }
}, {
    timestamps: true
});

module.exports = Despesa;
