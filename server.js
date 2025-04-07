// server.js - File chính của ứng dụng
const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const dotenv = require('dotenv');
const { testConnection } = require('./config/database');
const { connectRabbitMQ, setupExchangesAndQueues } = require('./config/rabbitmq');
const configureWebSocket = require('./config/socket');

// Cấu hình Passport
require('./config/passport')();

// Import routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const roomRoutes = require('./routes/room.routes');
const videoRoutes = require('./routes/video.routes');
const menuRoutes = require('./routes/menus.routes');
const movieRoutes = require('./routes/movie.routes');
const subscriptionRoutes = require('./routes/subscription.routes');
const paymentRoutes = require('./routes/payment.routes');

// Cấu hình biến môi trường
dotenv.config();

// Khởi tạo ứng dụng Express
const app = express();
const server = http.createServer(app);

// Cấu hình middleware
app.use(helmet({
  contentSecurityPolicy: false // Tắt CSP để cho phép video streaming
}));
app.use(morgan('dev')); // Logger
app.use(express.json({ limit: process.env.MAX_FILE_SIZE || '50mb' }));
app.use(express.urlencoded({ extended: true, limit: process.env.MAX_FILE_SIZE || '50mb' }));
app.use(compression()); // Nén HTTP

// Cấu hình CORS
app.use(cors({
  origin: ["http://localhost:3000", "https://hlong-cinemate.vercel.app", "https://cinemate-express.vercel.app" ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

// Serve static files
app.use('/thumbnails', express.static(path.join(__dirname, 'thumbnails')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Thiết lập routes
// Đặt trước để xử lý tin nhắn chat
app.use('/api/menus', menuRoutes); // Đặt trước để xử lý menus
app.use('/api/auth', authRoutes);
app.use('/api', userRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/video', videoRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/payments', paymentRoutes);
// Root endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to CineMate API' });
});

// Khởi tạo WebSocket
const { io, wss } = configureWebSocket(server);

// Khởi động server
const PORT = process.env.PORT || 8080;
async function startServer() {
  try {
    // Kiểm tra kết nối MySQL
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error('Không thể kết nối đến MySQL, đang dừng server...');
      process.exit(1);
    }
    
    // Kết nối đến RabbitMQ qua STOMP
    try {
      const stompClient = await connectRabbitMQ();
      console.log('Kết nối RabbitMQ STOMP thành công');
    } catch (error) {
      console.warn('Không thể kết nối đến RabbitMQ STOMP:', error.message);
      console.warn('Server sẽ tiếp tục chạy nhưng tính năng đồng bộ tin nhắn sẽ bị hạn chế');
    }
    
    // Khởi động HTTP server
    server.listen(PORT, () => {
      console.log(`Server đang chạy trên port ${PORT}`);
      console.log(`STOMP WebSocket sẵn sàng tại ws://localhost:${PORT}/ws`);
    });
    
    // Xử lý tắt server
    process.on('SIGINT', async () => {
      console.log('Đang tắt server...');
      await closeConnection(); // Đóng kết nối STOMP
      server.close();
      process.exit(0);
    });
  } catch (error) {
    console.error('Lỗi khi khởi động server:', error);
    process.exit(1);
  }
}

startServer();