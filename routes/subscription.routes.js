// routes/subscription.routes.js
const express = require('express');
const SubscriptionController = require('../controllers/subscription.controller');
const router = express.Router();

// Khởi tạo controller
const subscriptionController = new SubscriptionController();

// Middleware xác thực (ví dụ)
const authenticateUser = (req, res, next) => {
  // TODO: Implement actual authentication
  next();
};

// Routes cho subscription
router.post('/', authenticateUser, subscriptionController.createSubscription);
router.get('/user/:user_id', authenticateUser, subscriptionController.getUserSubscription);
router.put('/cancel/:subscription_id', authenticateUser, subscriptionController.cancelSubscription);

module.exports = router;