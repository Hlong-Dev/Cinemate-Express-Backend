// models/role.model.js
module.exports = (sequelize, DataTypes) => {
    const Role = sequelize.define('role', {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: DataTypes.STRING(50),
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [1, 50]
        }
      },
      description: {
        type: DataTypes.STRING(250),
        validate: {
          len: [0, 250]
        }
      }
    }, {
      timestamps: true,
      tableName: 'role',
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci'
    });
  
    return Role;
  };