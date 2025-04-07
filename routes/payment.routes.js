const express = require('express');
const PaymentController = require('../controllers/payment.controller');
const router = express.Router();

// Khởi tạo controller
const paymentController = new PaymentController();

// Middleware xác thực (ví dụ)
const authenticateUser = (req, res, next) => {
  // TODO: Implement actual authentication
  next();
};

// Routes cho payment
router.post('/', authenticateUser, paymentController.createPayment);
router.put('/confirm/:transaction_code', paymentController.confirmPayment);
router.get('/user/:user_id', authenticateUser, paymentController.getUserPayments);

module.exports = router;