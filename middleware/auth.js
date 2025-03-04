// middleware/auth.js
const jwt = require('jsonwebtoken');
const db = require('../models');
const User = db.users;

/**
 * Middleware xác thực token JWT
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next function
 */
const verifyToken = async (req, res, next) => {
  try {
    // Lấy token từ header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // Cho phép tiếp tục mà không có thông tin người dùng
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return next();
    }
    
    try {
      // Giải mã token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Kiểm tra user tồn tại - lưu ý sử dụng decoded.sub thay vì decoded.id
      const user = await User.findOne({ 
        where: { username: decoded.sub }
      });
      
      if (!user) {
        return next();
      }
      
      // Kiểm tra trạng thái tài khoản
      if (!user.accountNonLocked) {
        return res.status(401).json({ message: 'Tài khoản đã bị khóa' });
      }
      
      // Gán thông tin người dùng vào request - chỉ sử dụng các thông tin có trong token
      req.userId = user.id; // Lấy id từ database
      req.username = decoded.sub; // Username lấy từ trường sub
      req.avtUrl = decoded.avt_url; // avtUrl lấy từ trường avt_url
      
      // Tìm roles từ database
      const userWithRoles = await User.findByPk(user.id, {
        include: [{
          model: db.roles,
          attributes: ['name'],
          through: { attributes: [] }
        }]
      });
      
      req.roles = userWithRoles.roles.map(role => role.name);
      
      next();
    } catch (error) {
      // Token không hợp lệ
      console.error('Token error:', error.message);
      next();
    }
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ message: 'Lỗi xác thực token' });
  }
};

/**
 * Middleware kiểm tra xác thực
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next function
 */
const requireAuth = (req, res, next) => {
  if (!req.userId) {
    return res.status(401).json({ message: 'Vui lòng đăng nhập để tiếp tục' });
  }
  
  next();
};

/**
 * Middleware kiểm tra quyền admin
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next function
 */
const requireAdmin = (req, res, next) => {
  if (!req.userId) {
    return res.status(401).json({ message: 'Vui lòng đăng nhập để tiếp tục' });
  }
  
  if (!req.roles || !req.roles.includes('ROLE_ADMIN')) {
    return res.status(403).json({ message: 'Bạn không có quyền thực hiện hành động này' });
  }
  
  next();
};

module.exports = {
  verifyToken,
  requireAuth,
  requireAdmin
};