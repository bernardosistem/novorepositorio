// Contato.js
const { DataTypes } = require('sequelize');
const sequelize = require('../database/database');
const Membros = require('../membro/Membro');

const Contato = sequelize.define('Contato', {
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: true,
    },
  },
  numero_telemovel: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});



Membros.hasMany(Contato);
Contato.belongsTo(Membros);


module.exports = Contato;
