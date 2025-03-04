// controllers/user.controller.js
const userService = require('../services/userService');

/**
 * Đăng ký người dùng mới
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
exports.register = async (req, res) => {
  try {
    const { username, password, email, phone, address, avtUrl } = req.body;
    
    // Kiểm tra thông tin cần thiết
    if (!username || !password || !email) {
      return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin bắt buộc' });
    }
    
    // Đăng ký người dùng
    const user = await userService.register({
      username,
      password,
      email,
      phone,
      address,
      avtUrl
    });
    
    // Gán quyền mặc định
    await userService.setDefaultRole(username);
    
    res.status(200).json({ message: 'Đăng ký thành công' });
  } catch (error) {
    res.status(400).json({ message: error.message || 'Đăng ký thất bại' });
  }
};

/**
 * Lấy thông tin người dùng hiện tại
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
exports.getCurrentUser = async (req, res) => {
  try {
    // User ID được đính kèm bởi middleware xác thực
    if (!req.userId) {
      return res.status(200).json({});
    }
    
    const user = await userService.findByUsername(req.username);
    
    if (!user) {
      return res.status(404).json({ message: 'Người dùng không tồn tại' });
    }
    
    // Không trả về mật khẩu
    const { password, ...userInfo } = user.toJSON();
    
    res.status(200).json(userInfo);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Lỗi server' });
  }
};

/**
 * Khóa tài khoản người dùng
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
exports.lockUserAccount = async (req, res) => {
  try {
    const { username } = req.body;
    
    if (!username) {
      return res.status(400).json({ message: 'Vui lòng cung cấp tên đăng nhập' });
    }
    
    await userService.lockUserAccount(username);
    
    res.status(200).json({ message: 'Khóa tài khoản thành công' });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Lỗi server' });
  }
};

/**
 * Mở khóa tài khoản người dùng
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
exports.unlockUserAccount = async (req, res) => {
  try {
    const { username } = req.body;
    
    if (!username) {
      return res.status(400).json({ message: 'Vui lòng cung cấp tên đăng nhập' });
    }
    
    await userService.unlockUserAccount(username);
    
    res.status(200).json({ message: 'Mở khóa tài khoản thành công' });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Lỗi server' });
  }
};

/**
 * Lấy danh sách tất cả người dùng
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
exports.getAllUsers = async (req, res) => {
  try {
    const users = await userService.getAllUsers();
    
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Lỗi server' });
  }
};