// controllers/subscription.controller.js
const db = require('../models');
const Subscription = db.subscriptions;
const User = db.users;

class SubscriptionController {
  // Tạo đăng ký mới
  async createSubscription(req, res) {
    try {
      const { user_id, plan_name } = req.body;

      // Kiểm tra user
      const user = await User.findByPk(user_id);
      if (!user) {
        return res.status(404).json({ message: 'Người dùng không tồn tại' });
      }

      // Kiểm tra đăng ký hiện tại
      const existingSubscription = await Subscription.findOne({
        where: { 
          user_id, 
          status: ['active', 'pending'] 
        }
      });

      if (existingSubscription) {
        return res.status(400).json({ 
          message: 'Người dùng đã có gói đăng ký' 
        });
      }

      // Tạo đăng ký mới
      const subscription = await Subscription.createSubscription({ 
        user_id, 
        plan_name 
      });

      res.status(201).json({
        message: 'Tạo đăng ký thành công',
        data: subscription
      });
    } catch (error) {
      console.error('Lỗi tạo đăng ký:', error);
      res.status(500).json({
        message: 'Lỗi hệ thống',
        error: error.message
      });
    }
  }

  // Lấy thông tin đăng ký của user
  async getUserSubscription(req, res) {
    try {
      const { user_id } = req.params;

      // Kiểm tra user
      const user = await User.findByPk(user_id);
      if (!user) {
        return res.status(404).json({ message: 'Người dùng không tồn tại' });
      }

      const subscription = await Subscription.findOne({
        where: { 
          user_id, 
          status: ['active', 'pending'] 
        }
      });

      if (!subscription) {
        return res.status(404).json({ 
          message: 'Không tìm thấy gói đăng ký' 
        });
      }

      res.status(200).json(subscription);
    } catch (error) {
      console.error('Lỗi lấy đăng ký:', error);
      res.status(500).json({
        message: 'Lỗi hệ thống',
        error: error.message
      });
    }
  }

  // Hủy đăng ký
  async cancelSubscription(req, res) {
    try {
      const { subscription_id } = req.params;

      const subscription = await Subscription.findByPk(subscription_id);
      
      if (!subscription) {
        return res.status(404).json({ 
          message: 'Không tìm thấy gói đăng ký' 
        });
      }

      subscription.status = 'cancelled';
      await subscription.save();

      res.status(200).json({
        message: 'Hủy đăng ký thành công'
      });
    } catch (error) {
      console.error('Lỗi hủy đăng ký:', error);
      res.status(500).json({
        message: 'Lỗi hệ thống',
        error: error.message
      });
    }
  }
}

module.exports = SubscriptionController;