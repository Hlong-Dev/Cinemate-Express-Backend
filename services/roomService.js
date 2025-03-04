// services/roomService.js
const db = require('../models');
const Room = db.rooms;
const User = db.users;

class RoomService {
  /**
   * Lấy tất cả các phòng
   * @returns {Promise<Array>}
   */
  async getAllRooms() {
    try {
      const rooms = await Room.findAll();
      return rooms;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Lấy phòng theo ID
   * @param {number} id 
   * @returns {Promise<Object>}
   */
  async getRoomById(id) {
    try {
      const room = await Room.findByPk(id);
      if (!room) {
        throw new Error('Phòng không tồn tại');
      }
      return room;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Tạo phòng mới
   * @param {string} username - Username của chủ phòng
   * @returns {Promise<Object>}
   */
  async createRoom(username, roomData = {}) {
    try {
      // Tìm user để lấy avatar URL
      const user = await User.findOne({ where: { username } });
      
      // Tạo phòng mới
      const room = await Room.create({
        name: roomData.name || `Phòng của ${username}`,
        owner_Username: username,
        thumbnail: roomData.thumbnail || user?.avtUrl || 'https://i.imgur.com/Tr9qnkI.jpeg',
        current_video_url: roomData.current_video_url || null,
        current_video_title: roomData.current_video_title || null
      });
      return room;
    } catch (error) {
      throw error;
    }
  }
  /**
   * Xóa phòng
   * @param {number} id - ID phòng
   * @param {string} username - Username của người yêu cầu
   * @returns {Promise<boolean>}
   */
  async deleteRoom(id, username) {
    try {
      const room = await Room.findByPk(id);
      if (!room) {
        throw new Error('Phòng không tồn tại');
      }

      // Kiểm tra quyền xóa phòng
      if (room.owner_Username !== username) {
        throw new Error('Bạn không có quyền xóa phòng này');
      }

      // Xóa phòng
      await room.destroy();
      return true;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Cập nhật thông tin video của phòng
   * @param {number} roomId - ID phòng
   * @param {Object} videoData - Thông tin video mới
   * @returns {Promise<Object>}
   */
  async updateRoomVideo(roomId, videoData) {
    try {
      const room = await Room.findByPk(roomId);
      if (!room) {
        throw new Error('Phòng không tồn tại');
      }
  
      // Cập nhật thông tin video (sửa tên trường)
      room.current_video_url = videoData.current_video_url;
      room.current_video_title = videoData.current_video_title;
      
      await room.save();
      return room;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new RoomService();