// models/room.model.js
module.exports = (sequelize, DataTypes) => {
    const Room = sequelize.define('rooms', {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      current_video_url: {  // Sửa thành chữ thường
        type: DataTypes.STRING
      },
      current_video_title: {  // Sửa thành chữ thường
        type: DataTypes.STRING
      },
      thumbnail: {
        type: DataTypes.STRING,
        defaultValue: 'https://i.imgur.com/Tr9qnkI.jpeg'
      },
      owner_Username: {
        type: DataTypes.STRING,
        allowNull: false
      }
    }, {
      timestamps: false,
      tableName: 'rooms',
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci'
    });
  
    return Room;
  };