// config/rabbitmq.js - Sửa lại để chuyển đổi giữa destination trong STOMP và RabbitMQ
const StompJs = require('@stomp/stompjs');
const WebSocket = require('ws');
const dotenv = require('dotenv');
dotenv.config();

let stompClient = null;

// Kết nối đến RabbitMQ bằng STOMP
async function connectRabbitMQ() {
  try {
    const client = new StompJs.Client({
      brokerURL: `ws://${process.env.RABBITMQ_HOST || 'localhost'}:${process.env.RABBITMQ_STOMP_PORT || '15674'}/ws`,
      connectHeaders: {
        login: process.env.RABBITMQ_USERNAME || 'guest',
        passcode: process.env.RABBITMQ_PASSWORD || 'guest',
      },
      debug: function(str) {
        console.log('STOMP Debug: ' + str);
      },
      reconnectDelay: 5000, // Thử kết nối lại sau 5 giây
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000
    });
    
    // Xử lý lỗi kết nối
    client.onStompError = function(frame) {
      console.error('STOMP Error:', frame.headers['message']);
      console.error('STOMP Error details:', frame.body);
    };
    
    // Xử lý sự kiện kết nối
    client.onConnect = function(frame) {
      console.log('Kết nối STOMP thành công!');
    };
    
    // Xử lý sự kiện ngắt kết nối
    client.onDisconnect = function() {
      console.log('Ngắt kết nối STOMP');
    };
    
    // Xử lý sự kiện WebSocket
    client.webSocketFactory = function() {
      return new WebSocket(`ws://${process.env.RABBITMQ_HOST || 'localhost'}:${process.env.RABBITMQ_STOMP_PORT || '15674'}/ws`);
    };
    
    // Kết nối đến broker
    client.activate();
    stompClient = client;
    return client;
  } catch (error) {
    console.error('Không thể kết nối đến RabbitMQ qua STOMP:', error);
    throw error;
  }
}

// Thiết lập exchanges và queues
async function setupExchangesAndQueues() {
  // Lưu ý: Với STOMP không cần tạo exchanges và queues trước
  // RabbitMQ + STOMP tự động xử lý điều này thông qua destinations
  console.log('Đã chuẩn bị STOMP destinations');
  return true;
}

// Đăng ký queue cho phòng - Sửa lại để khớp với frontend
async function registerRoomQueue(roomId) {
  // Cấu hình destination đúng với client
  const chatDestination = `/topic/${roomId}`;
  
  console.log(`Đã đăng ký STOMP destinations cho phòng ${roomId}`);
  return { chatDestination };
}

// Gửi tin nhắn qua STOMP - Sửa lại để khớp với frontend
async function publishMessage(exchange, routingKey, message) {
  try {
    if (!stompClient || !stompClient.connected) {
      console.warn('STOMP client chưa kết nối, không thể gửi tin nhắn');
      return;
    }
    
    // Chuyển đổi từ định dạng exchange/routingKey sang STOMP destination
    let destination;
    
    // Cả chat và video đều sử dụng cùng một destination
    if (exchange === 'chat.exchange' || exchange === 'video.exchange') {
      const roomId = routingKey.split('.')[1];
      destination = `/topic/${roomId}`; // Destination mà client đang subscribe
    } else {
      destination = `/${exchange}/${routingKey}`;
    }
    
    // Gửi tin nhắn qua STOMP
    stompClient.publish({
      destination: destination,
      body: JSON.stringify(message),
      headers: { 'content-type': 'application/json' }
    });
    console.log(`Đã gửi tin nhắn đến ${destination}`);
  } catch (error) {
    console.error('Lỗi khi gửi tin nhắn qua STOMP:', error);
  }
}

// Đóng kết nối
async function closeConnection() {
  if (stompClient && stompClient.connected) {
    stompClient.deactivate();
    console.log('Đã đóng kết nối STOMP');
  }
}

module.exports = {
  connectRabbitMQ,
  setupExchangesAndQueues,
  registerRoomQueue,
  publishMessage,
  closeConnection
};