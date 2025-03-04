// routes/user.routes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { verifyToken, requireAuth, requireAdmin } = require('../middleware/auth');

// Đăng ký người dùng
router.post('/register', userController.register);

// Lấy thông tin người dùng hiện tại
router.get('/current-user', verifyToken, userController.getCurrentUser);

// Quản lý tài khoản (yêu cầu quyền ADMIN)
router.post('/lock-account', verifyToken, requireAdmin, userController.lockUserAccount);
router.post('/unlock-account', verifyToken, requireAdmin, userController.unlockUserAccount);
router.get('/users', verifyToken, requireAdmin, userController.getAllUsers);

module.exports = router;