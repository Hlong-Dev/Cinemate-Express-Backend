module.exports = (sequelize, DataTypes) => {
    const Payment = sequelize.define('payments', {
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
      subscription_id: {
        type: DataTypes.BIGINT,
        references: {
          model: 'subscriptions',
          key: 'id'
        }
      },
      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
      },
      payment_method: {
        type: DataTypes.ENUM(
          'credit_card', 
          'debit_card', 
          'paypal', 
          'bank_transfer', 
          'momo', 
          'vnpay'
        ),
        allowNull: false
      },
      transaction_code: {
        type: DataTypes.STRING,
        unique: true
      },
      status: {
        type: DataTypes.ENUM(
          'pending', 
          'completed', 
          'failed', 
          'refunded'
        ),
        defaultValue: 'pending'
      },
      payment_date: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      },
      metadata: {
        type: DataTypes.TEXT,
        get() {
          const rawValue = this.getDataValue('metadata');
          return rawValue ? JSON.parse(rawValue) : {};
        },
        set(value) {
          this.setDataValue('metadata', JSON.stringify(value));
        }
      }
    }, {
      timestamps: true,
      tableName: 'payments',
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci'
    });
  
    // Phương thức tạo thanh toán
    Payment.createPayment = async (paymentData) => {
      // Sinh mã giao dịch
      paymentData.transaction_code = `TX-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      return await Payment.create(paymentData);
    };
  
    // Xác nhận thanh toán
    Payment.confirmPayment = async (transactionCode) => {
      const payment = await Payment.findOne({ 
        where: { transaction_code: transactionCode } 
      });
  
      if (!payment) {
        throw new Error('Thanh toán không tồn tại');
      }
  
      payment.status = 'completed';
      return await payment.save();
    };
  
    return Payment;
  };