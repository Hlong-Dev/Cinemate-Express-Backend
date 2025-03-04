// routes/auth.routes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const passport = require('passport');

// Đăng nhập
router.post('/login', authController.login);

// Xác thực token
router.get('/verify', authController.verifyToken);

// OAuth Google
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Callback cho OAuth Google
router.get('/google/callback',
  authController.googleCallback
);

module.exports = router;