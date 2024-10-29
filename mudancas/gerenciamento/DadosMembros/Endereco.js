// Endereco.js
const { DataTypes } = require('sequelize');
const sequelize = require('../database/database');
const Membros = require('../membro/Membro');

const Endereco = sequelize.define('Endereco', {
  provincia: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  municipio: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  comuna: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  zona: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  quarteirao: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  bairro: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  rua: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  bloco: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  predio: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  andar: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  apartamento: {
    type: DataTypes.STRING,
    allowNull: true,
  },
});




Membros.hasMany(Endereco);
Endereco.belongsTo(Membros);

module.exports = Endereco;
