// models/customer.model.js
module.exports = (sequelize, DataTypes) => {
    const Customer = sequelize.define('customers', {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
      },
      nameCustomer: {
        type: DataTypes.STRING
      },
      phoneCustomer: {
        type: DataTypes.STRING
      },
      addressCustomer: {
        type: DataTypes.STRING
      },
      emailCustomer: {
        type: DataTypes.STRING
      }
    }, {
      timestamps: true,
      tableName: 'customers',
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci'
    });
  
    return Customer;
  };