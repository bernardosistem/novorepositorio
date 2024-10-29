const { DataTypes } = require('sequelize');
const sequelize = require('./database');
const Admin = require('./AdminTable'); // Importe aqui, se não estiver importado

const Foto = sequelize.define('fotoadmin', {
    caminho: {
        type: DataTypes.STRING,
        allowNull: false,
    }
});


Admin.hasMany(Foto);



module.exports = Foto;
