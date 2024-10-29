const Sequelize = require('sequelize');
const connection = require('../database/database');
const clientTable = require("../clientes/Clientes")

const Procedimentos  = connection.define('Procedimentos',{
    title : {
        type: Sequelize.STRING,
        allownull  : false
    },
    preco: {
        type: Sequelize.DECIMAL,
        allownull: false
    }
});



module.exports = Procedimentos;