// controllers/room.controller.js
const roomService = require('../services/roomService');

/**
 * Lấy tất cả các phòng
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
exports.getAllRooms = async (req, res) => {
  try {
    const rooms = await roomService.getAllRooms();
    
    res.status(200).json(rooms);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Lỗi server' });
  }
};

/**
 * Lấy phòng theo ID
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
exports.getRoomById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ message: 'ID phòng không hợp lệ' });
    }
    
    const room = await roomService.getRoomById(id);
    
    res.status(200).json(room);
  } catch (error) {
    if (error.message === 'Phòng không tồn tại') {
      return res.status(404).json({ message: error.message });
    }
    
    res.status(500).json({ message: error.message || 'Lỗi server' });
  }
};

/**
 * Tạo phòng mới
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
// controllers/room.controller.js
exports.createRoom = async (req, res) => {
    try {
      const { username, name, thumbnail, current_video_url, current_video_title } = req.body;
      
      if (!username) {
        return res.status(400).json({ message: 'Thiếu thông tin username' });
      }
      
      const roomData = {
        name,
        thumbnail,
        current_video_url,
        current_video_title
      };
      
      const room = await roomService.createRoom(username, roomData);
      
      res.status(201).json(room);
    } catch (error) {
      res.status(500).json({ message: error.message || 'Lỗi server' });
    }
  };
  
  exports.deleteRoom = async (req, res) => {
    try {
      const { id } = req.params;
      const { username } = req.body; // Lấy username từ request body
      
      if (!id) {
        return res.status(400).json({ message: 'ID phòng không hợp lệ' });
      }
      
      if (!username) {
        return res.status(400).json({ message: 'Thiếu thông tin username' });
      }
      
      await roomService.deleteRoom(id, username);
      
      res.status(200).json({ message: 'Xóa phòng thành công' });
    } catch (error) {
      // Xử lý lỗi...
      res.status(500).json({ message: error.message || 'Lỗi server' });
    }
  };
  
  exports.updateRoomVideo = async (req, res) => {
    try {
      const { roomId } = req.params;
      const { current_video_url, current_video_title } = req.body;
      
      await roomService.updateRoomVideo(roomId, {
        current_video_url,
        current_video_title: current_video_title || 'Video không tiêu đề'
      });
      
      res.status(200).json({ message: 'Cập nhật video thành công' });
    } catch (error) {
      res.status(500).json({ message: error.message || 'Lỗi server' });
    }
  };