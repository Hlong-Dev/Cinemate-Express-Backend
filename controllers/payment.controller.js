const db = require('../models');
const Payment = db.payments;
const User = db.users;
const Subscription = db.subscriptions;

class PaymentController {
  // Tạo thanh toán
  async createPayment(req, res) {
    try {
      const { 
        user_id, 
        subscription_id, 
        amount, 
        payment_method 
      } = req.body;

      // Kiểm tra user
      const user = await User.findByPk(user_id);
      if (!user) {
        return res.status(404).json({ message: 'Người dùng không tồn tại' });
      }

      // Kiểm tra subscription
      const subscription = await Subscription.findByPk(subscription_id);
      if (!subscription) {
        return res.status(404).json({ message: 'Gói đăng ký không tồn tại' });
      }

      // Tạo thanh toán
      const payment = await Payment.createPayment({
        user_id,
        subscription_id,
        amount,
        payment_method,
        status: 'pending'
      });

      res.status(201).json({
        message: 'Tạo thanh toán thành công',
        data: payment
      });
    } catch (error) {
      console.error('Lỗi tạo thanh toán:', error);
      res.status(500).json({
        message: 'Lỗi hệ thống',
        error: error.message
      });
    }
  }

  // Xác nhận thanh toán
  async confirmPayment(req, res) {
    try {
      const { transaction_code } = req.params;

      const payment = await Payment.confirmPayment(transaction_code);

      // Cập nhật trạng thái subscription
      const subscription = await Subscription.findByPk(payment.subscription_id);
      if (subscription) {
        subscription.status = 'active';
        await subscription.save();
      }

      res.status(200).json({
        message: 'Xác nhận thanh toán thành công',
        data: payment
      });
    } catch (error) {
      console.error('Lỗi xác nhận thanh toán:', error);
      res.status(500).json({
        message: 'Lỗi hệ thống',
        error: error.message
      });
    }
  }

  // Lấy lịch sử thanh toán của user
  async getUserPayments(req, res) {
    try {
      const { user_id } = req.params;

      // Kiểm tra user
      const user = await User.findByPk(user_id);
      if (!user) {
        return res.status(404).json({ message: 'Người dùng không tồn tại' });
      }

      const payments = await Payment.findAll({
        where: { user_id },
        order: [['payment_date', 'DESC']]
      });

      res.status(200).json(payments);
    } catch (error) {
      console.error('Lỗi lấy lịch sử thanh toán:', error);
      res.status(500).json({
        message: 'Lỗi hệ thống',
        error: error.message
      });
    }
  }
}

module.exports = PaymentController;