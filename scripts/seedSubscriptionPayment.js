// scripts/seedSubscriptionPayment.js
const db = require('../models');
const { Op } = require('sequelize');

// Hàm seed data
async function seedSubscriptionAndPayment() {
  try {
    // Tìm 3 user đầu tiên để lấy ID
    const users = await db.users.findAll({
      limit: 3,
      order: [['id', 'ASC']]
    });

    // Kiểm tra số lượng user
    if (users.length < 3) {
      throw new Error('Không đủ user để seed subscription');
    }

    // Xóa dữ liệu cũ
    await db.payments.destroy({ where: {} });
    await db.subscriptions.destroy({ where: {} });

    // Seed data cho Subscription
    const subscriptionSeedData = [
      {
        user_id: users[0].id,
        plan_name: 'Free',
        status: 'active',
        start_date: new Date(),
        end_date: (() => {
          const date = new Date();
          date.setDate(date.getDate() + 30);
          return date;
        })(),
        price: 0,
        max_screens: 1,
        features: JSON.stringify(['1 Screen', 'SD Quality', 'Limited Content'])
      },
      {
        user_id: users[1].id,
        plan_name: 'Standard',
        status: 'active',
        start_date: new Date(),
        end_date: (() => {
          const date = new Date();
          date.setDate(date.getDate() + 30);
          return date;
        })(),
        price: 14.99,
        max_screens: 2,
        features: JSON.stringify(['2 Screens', 'Full HD', 'Most Content', 'Download'])
      },
      {
        user_id: users[2].id,
        plan_name: 'Premium',
        status: 'active',
        start_date: new Date(),
        end_date: (() => {
          const date = new Date();
          date.setDate(date.getDate() + 30);
          return date;
        })(),
        price: 19.99,
        max_screens: 4,
        features: JSON.stringify(['4 Screens', '4K + HDR', 'All Content', 'Download', 'No Ads'])
      }
    ];

    // Tạo subscription
    const createdSubscriptions = await db.subscriptions.bulkCreate(subscriptionSeedData);

    // Seed data cho Payment
    const paymentSeedData = [
      {
        user_id: users[0].id,
        subscription_id: createdSubscriptions[0].id,
        amount: 0,
        payment_method: 'credit_card',
        transaction_code: `TX-${Date.now()}-FREE1`,
        status: 'completed',
        metadata: JSON.stringify({ description: 'Free plan activation' })
      },
      {
        user_id: users[1].id,
        subscription_id: createdSubscriptions[1].id,
        amount: 14.99,
        payment_method: 'paypal',
        transaction_code: `TX-${Date.now()}-STD2`,
        status: 'completed',
        metadata: JSON.stringify({ description: 'Standard plan payment' })
      },
      {
        user_id: users[2].id,
        subscription_id: createdSubscriptions[2].id,
        amount: 19.99,
        payment_method: 'credit_card',
        transaction_code: `TX-${Date.now()}-PRM3`,
        status: 'completed',
        metadata: JSON.stringify({ description: 'Premium plan payment' })
      }
    ];

    // Tạo payment
    await db.payments.bulkCreate(paymentSeedData);

    console.log('Seed dữ liệu Subscription và Payment thành công');
  } catch (error) {
    console.error('Lỗi khi seed dữ liệu:', error);
    throw error;
  }
}

// Chạy seed nếu được gọi trực tiếp
if (require.main === module) {
  seedSubscriptionAndPayment()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = {
  seedSubscriptionAndPayment
};