// config/socket.js - Sửa lại để xử lý destination từ frontend
const socketIo = require('socket.io');
const stompjs = require('@stomp/stompjs');
const WebSocket = require('ws');
const { publishMessage, registerRoomQueue } = require('./rabbitmq');
const { saveMessage } = require('../services/chatService');

function configureWebSocket(server) {
  // Khởi tạo Socket.IO
  const io = socketIo(server, {
    cors: {
      origin: ["http://localhost:3000", "https://hlong-cinemate.vercel.app"],
      methods: ["GET", "POST"],
      credentials: true
    },
    maxHttpBufferSize: 5e6, // 5MB cho upload ảnh
    pingTimeout: 60000, // 60s
    pingInterval: 25000 // 25s
  });
  
  // Khởi tạo STOMP Server qua WebSocket
  const wss = new WebSocket.Server({ noServer: true });
  
  // Xử lý upgrade từ HTTP sang WebSocket cho STOMP
  server.on('upgrade', (request, socket, head) => {
    if (request.url === '/ws') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
  });
  
  // Map để lưu trữ subscribers theo destination
  const subscribers = new Map();
  
  // Khởi tạo STOMP cho WebSocket
  wss.on('connection', (ws) => {
    console.log('Client đã kết nối qua WebSocket');
    
    // Xử lý tin nhắn WebSocket thuần
    ws.on('message', (message) => {
      try {
        const parsedMessage = JSON.parse(message);
        
        // Kiểm tra định dạng STOMP
        if (parsedMessage.command === 'CONNECT') {
          // Gửi CONNECTED frame
          ws.send(JSON.stringify({
            command: 'CONNECTED',
            headers: { version: '1.2' }
          }));
        }
        else if (parsedMessage.command === 'SUBSCRIBE') {
          // Xử lý đăng ký theo dõi một destination
          const destination = parsedMessage.headers.destination;
          const subscriptionId = parsedMessage.headers.id;
          
          // Lưu thông tin đăng ký vào WebSocket object
          if (!ws.subscriptions) {
            ws.subscriptions = {};
          }
          ws.subscriptions[subscriptionId] = destination;
          
          // Thêm vào map subscribers
          if (!subscribers.has(destination)) {
            subscribers.set(destination, new Set());
          }
          subscribers.get(destination).add(ws);
          
          console.log(`Client đăng ký ${destination} với ID ${subscriptionId}`);
        }
        else if (parsedMessage.command === 'SEND') {
          // Xử lý gửi tin nhắn đến một destination
          const destination = parsedMessage.headers.destination;
          const messageBody = parsedMessage.body;
          
          try {
            const messageObj = JSON.parse(messageBody);
            
            // Kiểm tra destination để xác định loại tin nhắn
            if (destination.startsWith('/app/chat.sendMessage/')) {
              const roomId = destination.split('/').pop();
              
              // Lưu tin nhắn vào database
              saveMessage(messageObj, roomId);
              
              // Broadcast tin nhắn đến subscribers của /topic/{roomId}
              const topicDestination = `/topic/${roomId}`;
              broadcastMessage(topicDestination, messageObj, subscriptionId => {
                return {
                  command: 'MESSAGE',
                  headers: {
                    'destination': topicDestination,
                    'subscription': subscriptionId,
                    'content-type': 'application/json'
                  },
                  body: JSON.stringify(messageObj)
                };
              });
            }
            else if (destination.startsWith('/app/chat.videoUpdate/')) {
              const roomId = destination.split('/').pop();
              
              // Broadcast tin nhắn đến subscribers của /topic/{roomId}
              const topicDestination = `/topic/${roomId}`;
              broadcastMessage(topicDestination, messageObj, subscriptionId => {
                return {
                  command: 'MESSAGE',
                  headers: {
                    'destination': topicDestination,
                    'subscription': subscriptionId,
                    'content-type': 'application/json'
                  },
                  body: JSON.stringify(messageObj)
                };
              });
            }
            else if (destination.startsWith('/app/chat.addUser/')) {
              const roomId = destination.split('/').pop();
              
              // Broadcast JOIN message đến subscribers của /topic/{roomId}
              const topicDestination = `/topic/${roomId}`;
              broadcastMessage(topicDestination, messageObj, subscriptionId => {
                return {
                  command: 'MESSAGE',
                  headers: {
                    'destination': topicDestination,
                    'subscription': subscriptionId,
                    'content-type': 'application/json'
                  },
                  body: JSON.stringify(messageObj)
                };
              });
            }
            else if (destination.startsWith('/app/chat.removeUser/')) {
              const roomId = destination.split('/').pop();
              
              // Broadcast LEAVE message đến subscribers của /topic/{roomId}
              const topicDestination = `/topic/${roomId}`;
              broadcastMessage(topicDestination, messageObj, subscriptionId => {
                return {
                  command: 'MESSAGE',
                  headers: {
                    'destination': topicDestination,
                    'subscription': subscriptionId,
                    'content-type': 'application/json'
                  },
                  body: JSON.stringify(messageObj)
                };
              });
            }
            else if (destination.startsWith('/app/chat.queueUpdate/')) {
              const roomId = destination.split('/').pop();
              
              // Broadcast QUEUE_UPDATE message đến subscribers của /topic/{roomId}
              const topicDestination = `/topic/${roomId}`;
              broadcastMessage(topicDestination, messageObj, subscriptionId => {
                return {
                  command: 'MESSAGE',
                  headers: {
                    'destination': topicDestination,
                    'subscription': subscriptionId,
                    'content-type': 'application/json'
                  },
                  body: JSON.stringify(messageObj)
                };
              });
            }
            else if (destination.startsWith('/app/chat.videoVote/')) {
              const roomId = destination.split('/').pop();
              
              // Broadcast VIDEO_VOTE message đến subscribers của /topic/{roomId}
              const topicDestination = `/topic/${roomId}`;
              broadcastMessage(topicDestination, messageObj, subscriptionId => {
                return {
                  command: 'MESSAGE',
                  headers: {
                    'destination': topicDestination,
                    'subscription': subscriptionId,
                    'content-type': 'application/json'
                  },
                  body: JSON.stringify(messageObj)
                };
              });
            }
            else if (destination.startsWith('/topic/')) {
              // Xử lý tin nhắn gửi trực tiếp đến topic
              broadcastMessage(destination, messageObj, subscriptionId => {
                return {
                  command: 'MESSAGE',
                  headers: {
                    'destination': destination,
                    'subscription': subscriptionId,
                    'content-type': 'application/json'
                  },
                  body: JSON.stringify(messageObj)
                };
              });
            }
          } catch (error) {
            console.error('Lỗi khi xử lý tin nhắn STOMP:', error);
          }
        }
        else if (parsedMessage.command === 'DISCONNECT') {
          // Xử lý ngắt kết nối
          ws.close();
        }
      } catch (error) {
        console.error('Lỗi khi xử lý tin nhắn WebSocket:', error);
      }
    });
    
    // Function để broadcast message đến subscribers
    function broadcastMessage(destination, messageObj, createMessage) {
      // Gửi tin nhắn đến tất cả clients đã subscribe destination
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN && client.subscriptions) {
          for (const subId in client.subscriptions) {
            if (client.subscriptions[subId] === destination) {
              const stompMessage = createMessage(subId);
              client.send(JSON.stringify(stompMessage));
            }
          }
        }
      });
    }
    
    ws.on('close', () => {
      console.log('Client đã ngắt kết nối WebSocket');
      
      // Xóa client khỏi danh sách subscribers
      if (ws.subscriptions) {
        for (const subId in ws.subscriptions) {
          const destination = ws.subscriptions[subId];
          if (subscribers.has(destination)) {
            subscribers.get(destination).delete(ws);
            if (subscribers.get(destination).size === 0) {
              subscribers.delete(destination);
            }
          }
        }
      }
    });
  });
  
  // Thiết lập Socket.IO
  io.on('connection', (socket) => {
    console.log('Client đã kết nối qua Socket.IO:', socket.id);
    
    // Xử lý người dùng tham gia phòng
    socket.on('joinRoom', async (data) => {
      try {
        const { roomId, username, avtUrl } = data;
        
        // Thêm socket vào room
        socket.join(roomId);
        
        // Lưu thông tin người dùng vào socket
        socket.username = username;
        socket.roomId = roomId;
        socket.avtUrl = avtUrl;
        
        // Đăng ký queue cho room trong RabbitMQ
        const { chatQueueName, videoQueueName } = await registerRoomQueue(roomId);
        
        // Gửi thông báo cho tất cả thành viên trong phòng
        io.to(roomId).emit('message', {
          type: 'JOIN',
          sender: username,
          avtUrl: avtUrl,
          content: `${username} đã tham gia phòng`
        });
        
        console.log(`${username} đã tham gia phòng ${roomId}`);
      } catch (error) {
        console.error('Lỗi khi xử lý tham gia phòng:', error);
      }
    });
    
    // Xử lý tin nhắn chat
    socket.on('sendMessage', async (data) => {
      try {
        const { roomId, message } = data;
        
        // Gửi tin nhắn đến tất cả thành viên trong phòng
        io.to(roomId).emit('message', message);
        
        // Gửi tin nhắn qua RabbitMQ để đồng bộ
        publishMessage('chat.exchange', `room.${roomId}`, message);
        
        // Lưu tin nhắn vào database
        await saveMessage(message, roomId);
      } catch (error) {
        console.error('Lỗi khi xử lý tin nhắn:', error);
      }
    });
    
    // Xử lý rời phòng
    socket.on('leaveRoom', (data) => {
      try {
        const { roomId } = data;
        socket.leave(roomId);
        
        if (socket.username && socket.roomId) {
          // Gửi thông báo rời phòng
          io.to(socket.roomId).emit('message', {
            type: 'LEAVE',
            sender: socket.username,
            avtUrl: socket.avtUrl,
            content: `${socket.username} đã rời phòng`
          });
        }
      } catch (error) {
        console.error('Lỗi khi xử lý rời phòng:', error);
      }
    });
    
    // Xử lý điều khiển video
    socket.on('videoControl', (data) => {
      try {
        const { roomId, action, time } = data;
        io.to(roomId).emit('videoControl', { action, time });
        
        // Gửi lệnh điều khiển qua RabbitMQ
        publishMessage('video.exchange', `video.${roomId}`, { action, time });
      } catch (error) {
        console.error('Lỗi khi xử lý điều khiển video:', error);
      }
    });
    
    // Xử lý cập nhật video
    socket.on('videoUpdate', (data) => {
      try {
        const { roomId, videoUrl, currentTime, type } = data;
        io.to(roomId).emit('videoUpdate', { videoUrl, currentTime, type });
        
        // Gửi thông tin cập nhật qua RabbitMQ
        publishMessage('video.exchange', `video.${roomId}`, { videoUrl, currentTime, type });
      } catch (error) {
        console.error('Lỗi khi xử lý cập nhật video:', error);
      }
    });
    
    // Xử lý ngắt kết nối
    socket.on('disconnect', () => {
      try {
        if (socket.username && socket.roomId) {
          // Gửi thông báo ngắt kết nối
          io.to(socket.roomId).emit('message', {
            type: 'LEAVE',
            sender: socket.username,
            avtUrl: socket.avtUrl,
            content: `${socket.username} đã ngắt kết nối`
          });
        }
        console.log(`Client ${socket.id} đã ngắt kết nối`);
      } catch (error) {
        console.error('Lỗi khi xử lý ngắt kết nối:', error);
      }
    });
  });
  
  return { io, wss };
}

module.exports = configureWebSocket;