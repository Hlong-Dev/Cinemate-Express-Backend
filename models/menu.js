// models/menu.model.js
module.exports = (sequelize, DataTypes) => {
    const Menu = sequelize.define('menu', {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
      },
      text: {
        type: DataTypes.STRING,
        allowNull: false
      },
      url: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "/"
      },
      parent_id: {
        type: DataTypes.BIGINT,
        references: {
          model: 'menu',
          key: 'id'
        },
        allowNull: true
      }
    }, {
      timestamps: true,
      tableName: 'menu',
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci'
    });
  
    // Self-referencing relationship for parent-child menu items
    Menu.associate = (models) => {
      Menu.hasMany(Menu, { as: 'children', foreignKey: 'parent_id' });
      Menu.belongsTo(Menu, { as: 'parent', foreignKey: 'parent_id' });
    };
  
    return Menu;
  };