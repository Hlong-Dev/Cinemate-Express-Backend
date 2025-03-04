// scripts/init-db.js
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

async function initializeDatabase() {
  try {
    // Tạo kết nối MySQL
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });
    
    console.log('Kết nối MySQL thành công');
    
    // Kiểm tra và tạo bảng role nếu chưa tồn tại
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS role (
        id BIGINT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(50) NOT NULL,
        description VARCHAR(250)
      )
    `);
    
    // Kiểm tra và tạo bảng user nếu chưa tồn tại
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS user (
        id BIGINT PRIMARY KEY AUTO_INCREMENT,
        username VARCHAR(50) NOT NULL UNIQUE,
        password VARCHAR(250) NOT NULL,
        email VARCHAR(50) NOT NULL UNIQUE,
        phone VARCHAR(10) UNIQUE,
        address VARCHAR(100),
        provider VARCHAR(50),
        provider_Id VARCHAR(100),
        avt_Url VARCHAR(255) DEFAULT 'https://i.imgur.com/Tr9qnkI.jpeg',
        account_Non_Locked BOOLEAN DEFAULT TRUE
      )
    `);
    
    // Kiểm tra và tạo bảng user_role nếu chưa tồn tại
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS user_role (
        user_id BIGINT,
        role_id BIGINT,
        PRIMARY KEY (user_id, role_id),
        FOREIGN KEY (user_id) REFERENCES user(id),
        FOREIGN KEY (role_id) REFERENCES role(id)
      )
    `);
    
    // Tạo các role mặc định
    const roles = [
      { name: 'ROLE_USER', description: 'Vai trò người dùng thông thường' },
      { name: 'ROLE_ADMIN', description: 'Vai trò quản trị viên' }
    ];
    
    for (const role of roles) {
      // Kiểm tra role đã tồn tại chưa
      const [existingRoles] = await connection.execute(
        'SELECT * FROM role WHERE name = ?',
        [role.name]
      );
      
      if (existingRoles.length === 0) {
        await connection.execute(
          'INSERT INTO role (name, description) VALUES (?, ?)',
          [role.name, role.description]
        );
        console.log(`Đã tạo role: ${role.name}`);
      }
    }
    
    // Tạo tài khoản admin mặc định
    const adminUsername = 'admin';
    
    // Kiểm tra admin đã tồn tại chưa
    const [existingAdmins] = await connection.execute(
      'SELECT * FROM user WHERE username = ?',
      [adminUsername]
    );
    
    if (existingAdmins.length === 0) {
      const adminPassword = await bcrypt.hash('admin123', 10);
      
      // Tạo admin
      const [result] = await connection.execute(
        'INSERT INTO user (username, password, email, phone, address, avtUrl) VALUES (?, ?, ?, ?, ?, ?)',
        [adminUsername, adminPassword, 'admin@example.com', '0123456789', 'Admin Address', 'https://i.imgur.com/Tr9qnkI.jpeg']
      );
      
      const adminId = result.insertId;
      
      // Lấy IDs của các role
      const [roles] = await connection.execute('SELECT * FROM role');
      const userRoleId = roles.find(r => r.name === 'ROLE_USER')?.id;
      const adminRoleId = roles.find(r => r.name === 'ROLE_ADMIN')?.id;
      
      // Gán roles cho admin
      if (userRoleId) {
        await connection.execute(
          'INSERT INTO user_role (user_id, role_id) VALUES (?, ?)',
          [adminId, userRoleId]
        );
      }
      
      if (adminRoleId) {
        await connection.execute(
          'INSERT INTO user_role (user_id, role_id) VALUES (?, ?)',
          [adminId, adminRoleId]
        );
      }
      
      console.log('Đã tạo tài khoản admin');
    }
    
    console.log('Khởi tạo database thành công');
    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error('Lỗi khi khởi tạo database:', error);
    process.exit(1);
  }
}

// Chạy script
initializeDatabase();