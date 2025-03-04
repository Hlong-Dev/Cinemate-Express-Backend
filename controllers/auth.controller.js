// controllers/auth.controller.js
const authService = require('../services/authService');
const passport = require('passport');

/**
 * Xử lý đăng nhập
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ message: 'Vui lòng nhập tên đăng nhập và mật khẩu' });
    }
    
    const { token, user } = await authService.login(username, password);
    
    res.status(200).json({ token, user });
  } catch (error) {
    res.status(401).json({ message: error.message || 'Đăng nhập thất bại' });
  }
};

/**
 * Xử lý đăng nhập bằng Google OAuth
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
exports.googleCallback = (req, res) => {
  passport.authenticate('google', { session: false }, async (err, user) => {
    if (err || !user) {
      return res.redirect(`${process.env.CLIENT_URL}/login?error=auth_failed`);
    }
    
    // Tạo token
    const token = await authService.createTokenForUser(user);
    
    // Chuyển hướng về trang chủ với token
    res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${token}`);
  })(req, res);
};

/**
 * Kiểm tra token
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
exports.verifyToken = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Token không được cung cấp' });
    }
    
    const decoded = await authService.verifyToken(token);
    
    res.status(200).json({ valid: true, user: decoded });
  } catch (error) {
    res.status(401).json({ valid: false, message: error.message });
  }
};