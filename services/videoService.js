// services/videoService.js
const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const { promisify } = require('util');
const statAsync = promisify(fs.stat);
const readdirAsync = promisify(fs.readdir);
const existsAsync = promisify(fs.exists);
const mkdirAsync = promisify(fs.mkdir);

// Cấu hình đường dẫn
const VIDEO_DIRECTORY = process.env.VIDEO_DIRECTORY || path.join(__dirname, '../videos');
const THUMBNAIL_DIRECTORY = process.env.THUMBNAIL_DIRECTORY || path.join(__dirname, '../thumbnails');
const CHUNK_SIZE = 500 * 1024; // 500KB per chunk

// Cấu hình FFmpeg
const ffmpegPath = process.env.FFMPEG_PATH;
if (ffmpegPath) {
  ffmpeg.setFfmpegPath(ffmpegPath);
}

class VideoService {
  /**
   * Lấy danh sách video
   * @returns {Promise<Array>}
   */
  async getVideoList() {
    try {
      // Kiểm tra thư mục video tồn tại
      if (!await existsAsync(VIDEO_DIRECTORY)) {
        await mkdirAsync(VIDEO_DIRECTORY, { recursive: true });
        return [];
      }

      // Đọc danh sách file trong thư mục
      const files = await readdirAsync(VIDEO_DIRECTORY);
      
      // Lọc và tạo thông tin cho các file video MP4
      const videoFiles = [];
      for (const file of files) {
        if (file.endsWith('.mp4')) {
          const title = file;
          const thumbnail = await this.generateThumbnailPath(file);
          const duration = await this.getVideoDuration(file) || '00:00';
          const url = `/video/play/${encodeURIComponent(file)}`;
          
          videoFiles.push({
            title,
            thumbnail,
            duration,
            url
          });
        }
      }
      
      return videoFiles;
    } catch (error) {
      console.error('Lỗi khi lấy danh sách video:', error);
      throw error;
    }
  }

  /**
   * Phát video với hỗ trợ streaming
   * @param {string} fileName - Tên file video
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async streamVideo(fileName, req, res) {
    try {
      const videoPath = path.join(VIDEO_DIRECTORY, fileName);
      
      // Kiểm tra file tồn tại
      if (!await existsAsync(videoPath)) {
        return res.status(404).send('Video không tồn tại');
      }
      
      // Lấy thông tin file
      const stat = await statAsync(videoPath);
      const fileSize = stat.size;
      
      // Xử lý Range header
      const range = req.headers.range;
      
      if (range) {
        // Xử lý yêu cầu phân đoạn
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : Math.min(start + CHUNK_SIZE - 1, fileSize - 1);
        
        const chunkSize = (end - start) + 1;
        const file = fs.createReadStream(videoPath, { start, end });
        
        // Thiết lập header cho partial content
        res.writeHead(206, {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunkSize,
          'Content-Type': 'video/mp4'
        });
        
        // Gửi file
        file.pipe(res);
      } else {
        // Trường hợp không có range, gửi toàn bộ file
        res.writeHead(200, {
          'Content-Length': fileSize,
          'Content-Type': 'video/mp4',
          'Accept-Ranges': 'bytes'
        });
        
        fs.createReadStream(videoPath).pipe(res);
      }
    } catch (error) {
      console.error('Lỗi khi phát video:', error);
      res.status(500).send('Lỗi server');
    }
  }

  /**
   * Tạo đường dẫn thumbnail cho video
   * @param {string} videoFileName - Tên file video
   * @returns {Promise<string>}
   */
  async generateThumbnailPath(videoFileName) {
    try {
      const thumbnailFileName = videoFileName.replace('.mp4', '.jpg');
      const thumbnailPath = path.join(THUMBNAIL_DIRECTORY, thumbnailFileName);
      
      // Tạo thư mục thumbnail nếu chưa tồn tại
      if (!await existsAsync(THUMBNAIL_DIRECTORY)) {
        await mkdirAsync(THUMBNAIL_DIRECTORY, { recursive: true });
      }
      
      // Kiểm tra thumbnail đã tồn tại chưa
      if (!await existsAsync(thumbnailPath)) {
        // Tạo thumbnail bằng FFmpeg
        const videoPath = path.join(VIDEO_DIRECTORY, videoFileName);
        
        if (await existsAsync(videoPath)) {
          await this.generateThumbnail(videoPath, thumbnailPath);
        } else {
          return '/thumbnails/default.jpg';
        }
      }
      
      // Trả về đường dẫn URL cho thumbnail
      return `/thumbnails/${encodeURIComponent(thumbnailFileName)}`;
    } catch (error) {
      console.error('Lỗi khi tạo đường dẫn thumbnail:', error);
      return '/thumbnails/default.jpg';
    }
  }

  /**
   * Tạo thumbnail từ video bằng FFmpeg
   * @param {string} videoPath - Đường dẫn file video
   * @param {string} thumbnailPath - Đường dẫn lưu thumbnail
   * @returns {Promise<boolean>}
   */
  generateThumbnail(videoPath, thumbnailPath) {
    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .on('error', (err) => {
          console.error('Lỗi khi tạo thumbnail:', err);
          reject(err);
        })
        .on('end', () => {
          resolve(true);
        })
        .screenshots({
          count: 1,
          folder: path.dirname(thumbnailPath),
          filename: path.basename(thumbnailPath),
          timemarks: ['00:00:05']
        });
    });
  }

  /**
   * Lấy thời lượng video
   * @param {string} videoFileName - Tên file video
   * @returns {Promise<string>}
   */
  getVideoDuration(videoFileName) {
    return new Promise((resolve, reject) => {
      const videoPath = path.join(VIDEO_DIRECTORY, videoFileName);
      
      ffmpeg.ffprobe(videoPath, (err, metadata) => {
        if (err) {
          console.error('Lỗi khi lấy thông tin video:', err);
          resolve('00:00');
          return;
        }
        
        // Lấy thời lượng video từ metadata
        const durationSeconds = metadata.format.duration || 0;
        const hours = Math.floor(durationSeconds / 3600);
        const minutes = Math.floor((durationSeconds % 3600) / 60);
        const seconds = Math.floor(durationSeconds % 60);
        
        // Format theo HH:MM:SS
        const formattedDuration = [
          hours.toString().padStart(2, '0'),
          minutes.toString().padStart(2, '0'),
          seconds.toString().padStart(2, '0')
        ].join(':');
        
        resolve(formattedDuration);
      });
    });
  }
}

module.exports = new VideoService();