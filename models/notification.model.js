// models/notification.model.js
module.exports = (sequelize, DataTypes) => {
    const Notification = sequelize.define('notification', {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
      },
      type: {
        type: DataTypes.ENUM('room_invite', 'video_added', 'chat_mention', 'system_alert', 'user_join', 'user_leave', 'video_sync'),
        allowNull: false
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      sender_id: {
        type: DataTypes.BIGINT,
        references: {
          model: 'user',
          key: 'id'
        },
        allowNull: true
      },
      related_room_id: {
        type: DataTypes.BIGINT,
        references: {
          model: 'rooms',
          key: 'id'
        },
        allowNull: true
      },
      related_video_id: {
        type: DataTypes.BIGINT,
        allowNull: true
      },
      related_message_id: {
        type: DataTypes.BIGINT,
        references: {
          model: 'chat_messages',
          key: 'id'
        },
        allowNull: true
      },
      expire_at: {
        type: DataTypes.DATE,
        allowNull: true
      },
      priority: {
        type: DataTypes.ENUM('low', 'normal', 'high', 'urgent'),
        defaultValue: 'normal'
      },
      actions: {
        type: DataTypes.JSON,
        allowNull: true
      },
      icon: {
        type: DataTypes.STRING,
        allowNull: true
      },
      is_global: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      }
    }, {
      timestamps: true,
      tableName: 'notification',
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci'
    });
  
    // Define recipient association model
    const NotificationRecipient = sequelize.define('notification_recipient', {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
      },
      notification_id: {
        type: DataTypes.BIGINT,
        references: {
          model: 'notification',
          key: 'id'
        },
        allowNull: false
      },
      user_id: {
        type: DataTypes.BIGINT,
        references: {
          model: 'user',
          key: 'id'
        },
        allowNull: false
      },
      read: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      read_at: {
        type: DataTypes.DATE,
        allowNull: true
      }
    }, {
      timestamps: true,
      tableName: 'notification_recipient',
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci'
    });
  
    // Define associations
    Notification.associate = (models) => {
      Notification.belongsTo(models.users, { as: 'sender', foreignKey: 'sender_id' });
      Notification.belongsTo(models.rooms, { as: 'relatedRoom', foreignKey: 'related_room_id' });
      Notification.belongsTo(models.chatMessages, { as: 'relatedMessage', foreignKey: 'related_message_id' });
      Notification.belongsToMany(models.users, { 
        through: NotificationRecipient,
        foreignKey: 'notification_id',
        otherKey: 'user_id',
        as: 'recipients'
      });
    };
  
    // Static methods
    Notification.findByUser = function(userId) {
      return sequelize.query(
        `SELECT n.* FROM notification n
         JOIN notification_recipient nr ON n.id = nr.notification_id
         WHERE nr.user_id = ? AND nr.read = false
         ORDER BY n.createdAt DESC`,
        {
          replacements: [userId],
          type: sequelize.QueryTypes.SELECT,
          model: Notification
        }
      );
    };
  
    Notification.markAllAsRead = function(userId) {
      return sequelize.query(
        `UPDATE notification_recipient
         SET read = true, read_at = NOW()
         WHERE user_id = ? AND read = false`,
        {
          replacements: [userId],
          type: sequelize.QueryTypes.UPDATE
        }
      );
    };
  
    // Instance methods
    Notification.prototype.markAsRead = async function(userId) {
      return sequelize.query(
        `UPDATE notification_recipient
         SET read = true, read_at = NOW()
         WHERE notification_id = ? AND user_id = ?`,
        {
          replacements: [this.id, userId],
          type: sequelize.QueryTypes.UPDATE
        }
      );
    };
  
    // Factory method
    Notification.createRoomInvite = async function(sender, recipient, room, message) {
      const notification = await Notification.create({
        type: 'room_invite',
        title: 'Lời mời tham gia phòng',
        message: message || `Bạn được mời tham gia phòng "${room.name}"`,
        sender_id: sender.id,
        related_room_id: room.id,
        priority: 'normal',
        icon: 'invitation',
        actions: JSON.stringify([
          {
            label: 'Tham gia',
            url: `/room/${room.id}`,
            actionType: 'button'
          },
          {
            label: 'Từ chối',
            actionType: 'dismiss'
          }
        ])
      });
  
      await NotificationRecipient.create({
        notification_id: notification.id,
        user_id: recipient.id
      });
  
      return notification;
    };
  
    return Notification;
  };