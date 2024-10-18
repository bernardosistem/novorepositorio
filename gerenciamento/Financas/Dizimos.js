// Dizimos.js
const { DataTypes } = require('sequelize');
const sequelize = require('../database/database');
const Membros = require('../membro/Membro');

const Dizimos = sequelize.define('Dizimos', {
  valor: {
    type: DataTypes.FLOAT,
    allowNull: false,
  }
});

// Associação entre Membros e Dízimos
Membros.hasMany(Dizimos);
Dizimos.belongsTo(Membros);

module.exports = Dizimos;
