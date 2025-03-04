// config/database.js - Cấu hình kết nối MySQL
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

// Tạo pool kết nối
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  namedPlaceholders: true,
  charset: 'utf8mb4',
  multipleStatements: true
});

// Kiểm tra kết nối
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('Kết nối MySQL thành công!');
    connection.release();
    return true;
  } catch (error) {
    console.error('Không thể kết nối đến MySQL:', error);
    return false;
  }
}

// Hàm thực thi câu lệnh SQL
async function query(sql, params) {
  try {
    const [results] = await pool.execute(sql, params);
    return results;
  } catch (error) {
    console.error('Lỗi khi thực thi truy vấn SQL:', error);
    throw error;
  }
}

module.exports = {
  pool,
  query,
  testConnection
};