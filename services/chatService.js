// services/chatService.js
const db = require('../models');
const ChatMessage = db.chatMessages;
const Room = db.rooms;

class ChatService {
  /**
   * Lưu tin nhắn vào database
   * @param {Object} message - Thông tin tin nhắn
   * @param {number|string} roomId - ID phòng
   * @returns {Promise<Object>}
   */
  async saveMessage(message, roomId) {
    try {
      // Kiểm tra phòng tồn tại
      const room = await Room.findByPk(roomId);
      if (!room) {
        throw new Error('Phòng không tồn tại');
      }

      // Xử lý reply
      let replyToId = null;
      if (message.replyTo && message.replyTo.id) {
        replyToId = message.replyTo.id;
      }

      // Lưu tin nhắn
      const chatMessage = await ChatMessage.create({
        content: message.content,
        sender: message.sender,
        room_id: roomId,
        image: message.image || null,
        type: message.type || 'CHAT',
        avtUrl: message.avtUrl,
        reply_to_id: replyToId
      });

      return chatMessage;
    } catch (error) {
      console.error('Lỗi khi lưu tin nhắn:', error);
      // Không throw lỗi để không ảnh hưởng đến luồng chat
      return null;
    }
  }

  /**
   * Lấy lịch sử tin nhắn của phòng
   * @param {number|string} roomId - ID phòng
   * @param {number} limit - Số lượng tin nhắn tối đa
   * @returns {Promise<Array>}
   */
  async getRoomMessages(roomId, limit = 50) {
    try {
      const messages = await ChatMessage.findAll({
        where: { room_id: roomId },
        include: [
          {
            model: ChatMessage,
            as: 'replyTo',
            attributes: ['id', 'content', 'sender', 'avtUrl']
          }
        ],
        order: [['createdAt', 'DESC']],
        limit
      });

      return messages.reverse();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Lưu tin nhắn hình ảnh
   * @param {Object} message - Thông tin tin nhắn
   * @param {number|string} roomId - ID phòng
   * @param {string} imageUrl - Đường dẫn hình ảnh
   * @returns {Promise<Object>}
   */
  async saveImageMessage(message, roomId, imageUrl) {
    try {
      // Tạo tin nhắn mới với loại IMAGE
      const imageMessage = {
        ...message,
        type: 'IMAGE',
        image: imageUrl,
        content: message.content || 'Image'
      };

      return await this.saveMessage(imageMessage, roomId);
    } catch (error) {
      console.error('Lỗi khi lưu tin nhắn hình ảnh:', error);
      return null;
    }
  }
}

module.exports = new ChatService();