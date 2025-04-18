// models/index.js - Khởi tạo Sequelize và định nghĩa các model
const { Sequelize, DataTypes } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

// Khởi tạo kết nối Sequelize
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    logging: false,
    dialectOptions: {
      charset: 'utf8mb4',
      dateStrings: true,
      typeCast: true
    },
    timezone: '+07:00', // Múi giờ Việt Nam
    define: {
      timestamps: false // Vô hiệu hóa timestamps cho tất cả các model
    }
  }
);

// Khởi tạo DB object
const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Định nghĩa các model
db.users = require('./user.model')(sequelize, DataTypes);
db.roles = require('./role.model')(sequelize, DataTypes);
db.rooms = require('./room.model')(sequelize, DataTypes);
db.chatMessages = require('./chatMessage.model')(sequelize, DataTypes);
db.customers = require('./customer.model')(sequelize, DataTypes);
db.movies = require('./movie.model')(sequelize, DataTypes);
db.subscriptions = require('./subscription.model')(sequelize, DataTypes);
db.payments = require('./payment.model')(sequelize, DataTypes);
// Thiết lập quan hệ giữa các model
// User - Role (Many-to-Many)
db.users.belongsToMany(db.roles, {
  through: 'user_roles',
  foreignKey: 'user_id',
  otherKey: 'role_id',
  timestamps: false
});
db.roles.belongsToMany(db.users, {
  through: 'user_roles',
  foreignKey: 'role_id',
  otherKey: 'user_id',
  timestamps: false
});
db.users.hasMany(db.subscriptions, { 
  foreignKey: 'user_id', 
  as: 'subscriptions' 
});
db.subscriptions.belongsTo(db.users, { 
  foreignKey: 'user_id', 
  as: 'user' 
});

// Payment - User (One-to-Many)
db.users.hasMany(db.payments, { 
  foreignKey: 'user_id', 
  as: 'payments' 
});
db.payments.belongsTo(db.users, { 
  foreignKey: 'user_id', 
  as: 'user' 
});

// Payment - Subscription (One-to-Many)
db.subscriptions.hasMany(db.payments, { 
  foreignKey: 'subscription_id', 
  as: 'payments' 
});
db.payments.belongsTo(db.subscriptions, { 
  foreignKey: 'subscription_id', 
  as: 'subscription' 
});
// Room - ChatMessage (One-to-Many)
db.rooms.hasMany(db.chatMessages, { as: 'messages', foreignKey: 'room_id' });
db.chatMessages.belongsTo(db.rooms, { foreignKey: 'room_id' });

// ChatMessage - ChatMessage (Self-referencing for replies)
db.chatMessages.hasMany(db.chatMessages, { as: 'replies', foreignKey: 'reply_to_id' });
db.chatMessages.belongsTo(db.chatMessages, { as: 'replyTo', foreignKey: 'reply_to_id' });
// Add these lines to your models/index.js file
db.menu = require('./menu')(sequelize, DataTypes);
db.notifications = require('./notification.model')(sequelize, DataTypes);
db.reactions = require('./reaction.model')(sequelize, DataTypes);

// And to set up the associations after all models are defined:
Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});
// Đồng bộ model với database (không tạo bảng)
db.sequelize.sync({ alter: false })
  .then(() => {
    console.log('Đồng bộ models thành công - Không tạo mới bảng');
  })
  .catch(err => {
    console.error('Lỗi khi đồng bộ models:', err);
  });

module.exports = db;