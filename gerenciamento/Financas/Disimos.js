const { DataTypes } = require('sequelize');
const sequelize = require('../database/database'); // Ajuste conforme o caminho da sua configuração
const Membros = require("../membro/Membro")

const Dizimos = sequelize.define('disimos', {
   
    valor: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    }
}, {
    timestamps: true
});


// Associação entre Membros e Dízimos
Membros.hasMany(Dizimos);
Dizimos.belongsTo(Membros);

module.exports = Dizimos;
