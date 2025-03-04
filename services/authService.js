// services/authService.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../models');
const User = db.users;
const Role = db.roles;

class AuthService {
  /**
   * Đăng nhập và tạo JWT token
   * @param {string} username 
   * @param {string} password 
   * @returns {Promise<{token: string, user: Object}>}
   */
  async login(username, password) {
    try {
      // Tìm user theo username
      const user = await User.findOne({
        where: { username },
        include: [
          {
            model: Role,
            attributes: ['id', 'name'],
            through: { attributes: [] }
          }
        ]
      });

      if (!user) {
        throw new Error('Tên đăng nhập hoặc mật khẩu không hợp lệ');
      }

      // Kiểm tra trạng thái tài khoản
      if (!user.account_Non_Locked) {
        throw new Error('Tài khoản đã bị khóa');
      }

      // Kiểm tra mật khẩu
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new Error('Tên đăng nhập hoặc mật khẩu không hợp lệ');
      }

      // Tạo JWT token với format yêu cầu
      const token = jwt.sign(
        { 
          sub: user.username,
          avt_url: user.avt_Url
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      return {
        token
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Xác thực token JWT
   * @param {string} token 
   * @returns {Promise<Object>}
   */
  async verifyToken(token) {
    try {
      // Giải mã token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Kiểm tra user có tồn tại không
      // Lưu ý: Vì token không còn chứa id, nên cần tìm user theo sub (username)
      const user = await User.findOne({
        where: { username: decoded.sub }
      });
      
      if (!user) {
        throw new Error('Người dùng không tồn tại');
      }

      // Kiểm tra trạng thái tài khoản
      if (!user.account_Non_Locked) {
        throw new Error('Tài khoản đã bị khóa');
      }

      return decoded;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new AuthService();