// models/reaction.model.js
module.exports = (sequelize, DataTypes) => {
    const Reaction = sequelize.define('reaction', {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
      },
      user_id: {
        type: DataTypes.BIGINT,
        references: {
          model: 'user',
          key: 'id'
        },
        allowNull: false
      },
      target_type: {
        type: DataTypes.ENUM('message', 'video', 'comment', 'room'),
        allowNull: false
      },
      target_id: {
        type: DataTypes.BIGINT,
        allowNull: false
      },
      reaction_type: {
        type: DataTypes.ENUM('like', 'love', 'haha', 'wow', 'sad', 'angry', 'thumbsup', 'thumbsdown', 'clap', 'fire'),
        allowNull: false
      },
      room_id: {
        type: DataTypes.BIGINT,
        references: {
          model: 'rooms',
          key: 'id'
        },
        allowNull: true
      },
      metadata: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: {}
      }
    }, {
      timestamps: true,
      tableName: 'reaction',
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
      indexes: [
        {
          unique: true,
          fields: ['user_id', 'target_type', 'target_id']
        },
        {
          fields: ['target_type', 'target_id']
        },
        {
          fields: ['room_id']
        }
      ]
    });
  
    // Define associations
    Reaction.associate = (models) => {
      Reaction.belongsTo(models.users, { foreignKey: 'user_id' });
      Reaction.belongsTo(models.rooms, { foreignKey: 'room_id' });
    };
  
    // Static methods
    Reaction.findByTarget = function(targetType, targetId) {
      return Reaction.findAll({
        where: {
          target_type: targetType,
          target_id: targetId
        }
      });
    };
  
    Reaction.getReactionCounts = async function(targetType, targetId) {
      return sequelize.query(
        `SELECT reaction_type as type, COUNT(*) as count 
         FROM reaction 
         WHERE target_type = ? AND target_id = ? 
         GROUP BY reaction_type`,
        {
          replacements: [targetType, targetId],
          type: sequelize.QueryTypes.SELECT
        }
      );
    };
  
    Reaction.toggleReaction = async function(userId, targetType, targetId, reactionType, roomId, metadata) {
      // Find existing reaction
      const existingReaction = await Reaction.findOne({
        where: {
          user_id: userId,
          target_type: targetType,
          target_id: targetId
        }
      });
      
      if (existingReaction) {
        // If same reaction type, delete it
        if (existingReaction.reaction_type === reactionType) {
          await existingReaction.destroy();
          
          // Update target object's reaction count
          await Reaction.updateTargetReactionCount(targetType, targetId, reactionType, -1);
          
          return null;
        } 
        // If different reaction type, update it
        else {
          const oldReactionType = existingReaction.reaction_type;
          
          existingReaction.reaction_type = reactionType;
          existingReaction.changed('updatedAt', true);
          
          if (metadata) {
            existingReaction.metadata = {
              ...existingReaction.metadata,
              ...metadata
            };
          }
          
          await existingReaction.save();
          
          // Update target object's reaction counts
          await Reaction.updateTargetReactionCount(targetType, targetId, oldReactionType, -1);
          await Reaction.updateTargetReactionCount(targetType, targetId, reactionType, 1);
          
          return existingReaction;
        }
      } 
      // Create new reaction
      else {
        const newReaction = await Reaction.create({
          user_id: userId,
          target_type: targetType,
          target_id: targetId,
          reaction_type: reactionType,
          room_id: roomId,
          metadata: metadata || {}
        });
        
        // Update target object's reaction count
        await Reaction.updateTargetReactionCount(targetType, targetId, reactionType, 1);
        
        return newReaction;
      }
    };
  
    // Helper method to update target's reaction count
    Reaction.updateTargetReactionCount = async function(targetType, targetId, reactionType, increment) {
      let model;
      switch (targetType) {
        case 'message':
          model = 'chat_messages';
          break;
        case 'room':
          model = 'rooms';
          break;
        case 'video':
          model = 'video_content';
          break;
        case 'comment':
          model = 'comment';
          break;
        default:
          return;
      }
  
      const query = `
        UPDATE ${model}
        SET reactions = JSON_SET(
          COALESCE(reactions, '{}'),
          '$.${reactionType}',
          COALESCE(JSON_EXTRACT(reactions, '$.${reactionType}'), 0) + ?
        )
        WHERE id = ?
      `;
  
      try {
        await sequelize.query(query, {
          replacements: [increment, targetId],
          type: sequelize.QueryTypes.UPDATE
        });
      } catch (error) {
        console.error('Lỗi khi cập nhật tổng số reaction:', error);
      }
    };
  
    // Hook for after create
    Reaction.afterCreate(async (reaction, options) => {
      // No need to implement this hook as updateTargetReactionCount is called in toggleReaction
    });
  
    // Hook for after destroy
    Reaction.afterDestroy(async (reaction, options) => {
      // No need to implement this hook as updateTargetReactionCount is called in toggleReaction
    });
  
    return Reaction;
  };