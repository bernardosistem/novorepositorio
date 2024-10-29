// Ofertas.js
const { DataTypes } = require('sequelize');
const sequelize = require('../database/database');
const Membros = require('../membro/Membro');

const Ofertas = sequelize.define('Ofertas', {
  valor: {
    type: DataTypes.FLOAT,
    allowNull: false,
  }
});

// Associação entre Membros e Ofertas (opcional, caso você queira rastrear quem ofertou)
Membros.hasMany(Ofertas);
Ofertas.belongsTo(Membros);

module.exports = Ofertas;
