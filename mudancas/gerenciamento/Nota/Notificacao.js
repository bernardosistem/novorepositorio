// Notificacoes.js
const { DataTypes } = require('sequelize');
const sequelize = require('../database/database');

const Notificacoes = sequelize.define('Notificacao', {
  tipo: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  mensagem: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  lida: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  ativa: {
    type: DataTypes.STRING,
    defaultValue: false,
  },
  tipo: {
    type: DataTypes.STRING,
    defaultValue: false,
  }

});





module.exports = Notificacoes;
