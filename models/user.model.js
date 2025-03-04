// models/user.model.js
module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define('user', {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
      },
      username: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
      },
      password: {
        type: DataTypes.STRING(250),
        allowNull: false
      },
      email: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
      },
      phone: {
        type: DataTypes.STRING(10),
        unique: true
      },
      address: {
        type: DataTypes.STRING(100)
      },
      provider: {
        type: DataTypes.STRING(50),
        field: 'provider' // Tên cột trong DB
      },
      providerId: {
        type: DataTypes.STRING(100),
        field: 'provider_Id' // Tên cột đúng trong DB
      },
      avt_Url: {
        type: DataTypes.STRING,
        defaultValue: 'https://i.imgur.com/Tr9qnkI.jpeg'
      },
      account_Non_Locked: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      }
    }, {
      timestamps: false,
      tableName: 'user',
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci'
    });
  
    return User;
  };