// DadosEclesiais.js
const { DataTypes } = require('sequelize');
const sequelize = require('../database/database');
const Membros = require('../membro/Membro');

const DadosEclesiais = sequelize.define('DadosEclesiais2', {
  situacao: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  categoria: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  funcao: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  dataConsagracao: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  dataBatismo: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  igrejaMatriz: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  filiais: {
    type: DataTypes.STRING,
    allowNull: true,
  },
});

// Associação com Membro


Membros.hasMany(DadosEclesiais);


module.exports = DadosEclesiais;
