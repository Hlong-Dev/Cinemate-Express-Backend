// services/userService.js
const bcrypt = require('bcryptjs');
const db = require('../models');
const User = db.users;
const Role = db.roles;

class UserService {
  /**
   * Đăng ký người dùng mới
   * @param {Object} userData 
   * @returns {Promise<Object>}
   */
  async register(userData) {
    try {
      // Kiểm tra username đã tồn tại chưa
      const existingUser = await User.findOne({ 
        where: { username: userData.username },
        attributes: { exclude: ['createdAt', 'updatedAt'] } // Loại trừ timestamps 
      });

      // Mã hóa mật khẩu
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      // Tạo người dùng mới
      const user = await User.create({
        username: userData.username,
        password: hashedPassword,
        email: userData.email,
        phone: userData.phone,
        address: userData.address,
        avtUrl: userData.avtUrl || 'https://i.imgur.com/Tr9qnkI.jpeg'
      });

      return user;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Thiết lập quyền mặc định cho người dùng
   * @param {string} username 
   * @returns {Promise<void>}
   */
  async setDefaultRole(username) {
    try {
      // Tìm người dùng
      const user = await User.findOne({ where: { username } });
      if (!user) {
        throw new Error('Người dùng không tồn tại');
      }

      // Tìm role USER
      const role = await Role.findOne({ where: { name: 'ROLE_USER' } });
      if (!role) {
        throw new Error('Role không tồn tại');
      }

      // Gán role cho người dùng
      await user.addRole(role);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Tìm người dùng theo username
   * @param {string} username 
   * @returns {Promise<Object>}
   */
  async findByUsername(username) {
    try {
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

      return user;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Khóa tài khoản người dùng
   * @param {string} username 
   * @returns {Promise<void>}
   */
  async lockUserAccount(username) {
    try {
      const user = await User.findOne({ where: { username } });
      if (!user) {
        throw new Error('Người dùng không tồn tại');
      }

      user.account_Non_Locked = false;
      await user.save();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Mở khóa tài khoản người dùng
   * @param {string} username 
   * @returns {Promise<void>}
   */
  async unlockUserAccount(username) {
    try {
      const user = await User.findOne({ where: { username } });
      if (!user) {
        throw new Error('Người dùng không tồn tại');
      }

      user.account_Non_Locked = true;
      await user.save();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Lấy số lượng người dùng
   * @returns {Promise<number>}
   */
  async getUserCount() {
    try {
      const count = await User.count();
      return count;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Lấy danh sách tất cả người dùng
   * @returns {Promise<Array>}
   */
  async getAllUsers() {
    try {
      const users = await User.findAll({
        attributes: { exclude: ['password'] },
        include: [
          {
            model: Role,
            attributes: ['id', 'name'],
            through: { attributes: [] }
          }
        ]
      });

      return users;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new UserService();