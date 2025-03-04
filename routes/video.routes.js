// routes/video.routes.js
const express = require('express');
const router = express.Router();
const path = require('path');
const videoController = require('../controllers/video.controller');

// Lấy danh sách video
router.get('/list', videoController.getVideoList);

// Phát video
router.get('/play/:fileName', videoController.streamVideo);

// Serve thumbnail
router.get('/thumbnails/:fileName', (req, res) => {
  const fileName = req.params.fileName;
  const thumbnailPath = path.join(process.env.THUMBNAIL_DIRECTORY, fileName);
  
  res.sendFile(thumbnailPath, (err) => {
    if (err) {
      console.error('Lỗi khi gửi thumbnail:', err);
      res.status(404).send('Thumbnail không tồn tại');
    }
  });
});

module.exports = router;