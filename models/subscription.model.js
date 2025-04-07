// 1. models/subscription.model.js
module.exports = (sequelize, DataTypes) => {
    const Subscription = sequelize.define('subscriptions', {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
      },
      user_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
          model: 'user',
          key: 'id'
        }
      },
      plan_name: {
        type: DataTypes.ENUM('Free', 'Basic', 'Standard', 'Premium'),
        allowNull: false,
        defaultValue: 'Free'
      },
      status: {
        type: DataTypes.ENUM('active', 'cancelled', 'expired', 'pending'),
        defaultValue: 'pending'
      },
      start_date: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      },
      end_date: {
        type: DataTypes.DATE
      },
      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      max_screens: {
        type: DataTypes.INTEGER,
        defaultValue: 1
      },
      features: {
        type: DataTypes.TEXT,
        get() {
          const rawValue = this.getDataValue('features');
          return rawValue ? JSON.parse(rawValue) : [];
        },
        set(value) {
          this.setDataValue('features', JSON.stringify(value));
        }
      }
    }, {
      timestamps: true,
      tableName: 'subscriptions',
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci'
    });
  
    // Phương thức tạo đăng ký
    Subscription.createSubscription = async (userData) => {
      const { user_id, plan_name } = userData;
      
      // Xác định giá và tính năng theo gói
      const planDetails = {
        'Free': { 
          price: 0, 
          features: ['1 Screen', 'SD Quality', 'Limited Content'],
          max_screens: 1
        },
        'Basic': { 
          price: 9.99, 
          features: ['1 Screen', 'HD Quality', 'Basic Content'],
          max_screens: 1
        },
        'Standard': { 
          price: 14.99, 
          features: ['2 Screens', 'Full HD', 'Most Content', 'Download'],
          max_screens: 2
        },
        'Premium': { 
          price: 19.99, 
          features: ['4 Screens', '4K + HDR', 'All Content', 'Download', 'No Ads'],
          max_screens: 4
        }
      };
  
      const planInfo = planDetails[plan_name] || planDetails['Free'];
  
      // Tính ngày hết hạn (30 ngày)
      const end_date = new Date();
      end_date.setDate(end_date.getDate() + 30);
  
      return await Subscription.create({
        user_id,
        plan_name,
        price: planInfo.price,
        status: 'active',
        end_date,
        max_screens: planInfo.max_screens,
        features: planInfo.features
      });
    };
  
    // Kiểm tra đăng ký còn hiệu lực
    Subscription.prototype.isActive = function() {
      return this.status === 'active' && 
             new Date() <= this.end_date;
    };
  
    return Subscription;
  };