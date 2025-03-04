// controllers/video.controller.js
const videoService = require('../services/videoService');

/**
 * Lấy danh sách video
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
exports.getVideoList = async (req, res) => {
  try {
    const videos = await videoService.getVideoList();
    
    res.status(200).json(videos);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Lỗi server' });
  }
};

/**
 * Phát video với hỗ trợ streaming
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
exports.streamVideo = async (req, res) => {
  try {
    const { fileName } = req.params;
    
    if (!fileName) {
      return res.status(400).json({ message: 'Tên file không hợp lệ' });
    }
    
    // Gọi service để xử lý stream video
    await videoService.streamVideo(fileName, req, res);
  } catch (error) {
    res.status(500).send('Lỗi khi phát video');
  }
};