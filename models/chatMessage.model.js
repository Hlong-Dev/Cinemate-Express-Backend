// models/chatMessage.model.js
module.exports = (sequelize, DataTypes) => {
    const ChatMessage = sequelize.define('chat_messages', {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
      },
      content: {
        type: DataTypes.TEXT
      },
      sender: {
        type: DataTypes.STRING,
        allowNull: false
      },
      room_id: {
        type: DataTypes.BIGINT,
        references: {
          model: 'rooms',
          key: 'id'
        }
      },
      image: {
        type: DataTypes.STRING
      },
      type: {
        type: DataTypes.ENUM('CHAT', 'JOIN', 'LEAVE', 'IMAGE'),
        defaultValue: 'CHAT'
      },
      avtUrl: {
        type: DataTypes.STRING
      },
      reply_to_id: {
        type: DataTypes.BIGINT,
        references: {
          model: 'chat_messages',
          key: 'id'
        },
        allowNull: true
      }
    }, {
      timestamps: true,
      tableName: 'chat_messages',
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci'
    });
  
    return ChatMessage;
  };