const { DataTypes } = require('sequelize');
const sequelize = require('./database');
const User = require('./User'); // Importe aqui, se não estiver importado

const Foto = sequelize.define('foto', {
    caminho: {
        type: DataTypes.STRING,
        allowNull: false,
    }
});


User.hasMany(Foto);



module.exports = Foto;
