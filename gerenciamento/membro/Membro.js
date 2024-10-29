// Membro.js
const { DataTypes } = require('sequelize');
const sequelize = require('../database/database');

const Membro = sequelize.define('Membro', {
  numero_membro: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  nome: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  data_nascimento: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  estado_civil: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  nacionalidade: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  naturalidade: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  provincia: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  bi: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  data_admissao_bi: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  local_emissao_bi: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  genero: {
    type: DataTypes.ENUM('Masculino', 'Feminino', 'Outro'),
    allowNull: false,
  },
  foto_membro: {
    type: DataTypes.STRING, // URL ou caminho do arquivo da foto
    allowNull: true,
  },
});


module.exports = Membro;
