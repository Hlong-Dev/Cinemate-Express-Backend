const Reaction = require('../models/reaction.model');
const mongoose = require('mongoose');
const { body, param, validationResult } = require('express-validator');

/**
 * Lấy tất cả reaction cho một đối tượng cụ thể
 */
exports.getReactionsByTarget = async (req, res) => {
  try {
    const { targetType, targetId } = req.params;
    
    // Validate targetType
    const validTargetTypes = ['message', 'video', 'comment', 'room'];
    if (!validTargetTypes.includes(targetType)) {
      return res.status(400).json({
        success: false,
        message: 'Loại đối tượng không hợp lệ.'
      });
    }
    
    // Validate targetId
    if (!mongoose.Types.ObjectId.isValid(targetId)) {
      return res.status(400).json({
        success: false,
        message: 'ID đối tượng không hợp lệ.'
      });
    }
    
    // Lấy các reaction
    const reactions = await Reaction.find({ targetType, targetId })
      .populate('userId', 'username avatar')
      .sort({ timestamp: -1 });
    
    return res.status(200).json({
      success: true,
      count: reactions.length,
      data: reactions
    });
  } catch (error) {
    console.error('Error fetching reactions:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy reactions.',
      error: error.message
    });
  }
};

/**
 * Lấy tổng số reaction theo từng loại cho một đối tượng
 */
exports.getReactionCounts = async (req, res) => {
  try {
    const { targetType, targetId } = req.params;
    
    // Validate targetType
    const validTargetTypes = ['message', 'video', 'comment', 'room'];
    if (!validTargetTypes.includes(targetType)) {
      return res.status(400).json({
        success: false,
        message: 'Loại đối tượng không hợp lệ.'
      });
    }
    
    // Validate targetId
    if (!mongoose.Types.ObjectId.isValid(targetId)) {
      return res.status(400).json({
        success: false,
        message: 'ID đối tượng không hợp lệ.'
      });
    }
    
    // Lấy số lượng reaction theo loại
    const counts = await Reaction.aggregate([
      { $match: { targetType, targetId: mongoose.Types.ObjectId(targetId) } },
      { $group: { _id: '$reactionType', count: { $sum: 1 } } },
      { $project: { _id: 0, type: '$_id', count: 1 } }
    ]);
    
    // Tạo một object với tất cả các loại reaction
    const allReactionTypes = ['like', 'love', 'haha', 'wow', 'sad', 'angry', 'thumbsup', 'thumbsdown', 'clap', 'fire'];
    const result = allReactionTypes.reduce((acc, type) => {
      acc[type] = 0;
      return acc;
    }, {});
    
    // Cập nhật số lượng từ kết quả aggregate
    counts.forEach(({ type, count }) => {
      result[type] = count;
    });
    
    // Thêm tổng số reaction
    result.total = Object.values(result).reduce((sum, count) => sum + count, 0);
    
    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error fetching reaction counts:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy số lượng reactions.',
      error: error.message
    });
  }
};

/**
 * Thêm hoặc xóa một reaction
 */
exports.toggleReaction = [
  // Validation
  body('targetType').isIn(['message', 'video', 'comment', 'room']).withMessage('Loại đối tượng không hợp lệ.'),
  body('targetId').isMongoId().withMessage('ID đối tượng không hợp lệ.'),
  body('reactionType').isIn(['like', 'love', 'haha', 'wow', 'sad', 'angry', 'thumbsup', 'thumbsdown', 'clap', 'fire']).withMessage('Loại reaction không hợp lệ.'),
  body('roomId').optional().isMongoId().withMessage('ID phòng không hợp lệ.'),
  body('metadata').optional().isObject().withMessage('Metadata phải là một object.'),
  body('metadata.timeInVideo').optional().isNumeric().withMessage('Thời điểm trong video phải là một số.'),
  body('metadata.message').optional().isString().withMessage('Tin nhắn phải là một chuỗi.'),
  body('metadata.visibility').optional().isIn(['public', 'room', 'private']).withMessage('Phạm vi hiển thị không hợp lệ.'),
  
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    try {
      const { targetType, targetId, reactionType, roomId, metadata } = req.body;
      const userId = req.user._id;
      
      // Kiểm tra đối tượng có tồn tại không
      const targetModel = mongoose.model(
        targetType === 'message' ? 'ChatMessage' : 
        targetType === 'video' ? 'VideoContent' : 
        targetType === 'room' ? 'Room' : 'Comment'
      );
      
      const target = await targetModel.findById(targetId);
      if (!target) {
        return res.status(404).json({
          success: false,
          message: `Không tìm thấy ${targetType} với ID đã cung cấp.`
        });
      }
      
      // Thêm/xóa reaction
      const reaction = await Reaction.toggleReaction(
        userId, 
        targetType, 
        targetId, 
        reactionType, 
        roomId, 
        metadata
      );
      
      // Lấy số lượng reaction theo loại sau khi cập nhật
      const counts = await Reaction.aggregate([
        { $match: { targetType, targetId: mongoose.Types.ObjectId(targetId) } },
        { $group: { _id: '$reactionType', count: { $sum: 1 } } },
        { $project: { _id: 0, type: '$_id', count: 1 } }
      ]);
      
      // Format lại kết quả
      const result = {};
      counts.forEach(({ type, count }) => {
        result[type] = count;
      });
      
      return res.status(200).json({
        success: true,
        message: reaction ? 'Đã thêm reaction.' : 'Đã xóa reaction.',
        isAdded: !!reaction,
        reaction,
        counts: result
      });
    } catch (error) {
      console.error('Error toggling reaction:', error);
      return res.status(500).json({
        success: false,
        message: 'Đã xảy ra lỗi khi thêm/xóa reaction.',
        error: error.message
      });
    }
  }
];

/**
 * Lấy reaction của người dùng hiện tại cho một đối tượng
 */
exports.getUserReaction = async (req, res) => {
  try {
    const { targetType, targetId } = req.params;
    const userId = req.user._id;
    
    // Validate targetType
    const validTargetTypes = ['message', 'video', 'comment', 'room'];
    if (!validTargetTypes.includes(targetType)) {
      return res.status(400).json({
        success: false,
        message: 'Loại đối tượng không hợp lệ.'
      });
    }
    
    // Validate targetId
    if (!mongoose.Types.ObjectId.isValid(targetId)) {
      return res.status(400).json({
        success: false,
        message: 'ID đối tượng không hợp lệ.'
      });
    }
    
    // Tìm reaction
    const reaction = await Reaction.findOne({
      userId,
      targetType,
      targetId
    });
    
    return res.status(200).json({
      success: true,
      data: reaction,
      hasReacted: !!reaction,
      reactionType: reaction ? reaction.reactionType : null
    });
  } catch (error) {
    console.error('Error fetching user reaction:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy reaction.',
      error: error.message
    });
  }
};

/**
 * Xóa reaction
 */
exports.deleteReaction = async (req, res) => {
  try {
    const { reactionId } = req.params;
    const userId = req.user._id;
    
    // Tìm reaction
    const reaction = await Reaction.findById(reactionId);
    
    // Kiểm tra xem reaction có tồn tại không
    if (!reaction) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy reaction.'
      });
    }
    
    // Kiểm tra xem người dùng có phải là người tạo reaction không
    if (reaction.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xóa reaction này.'
      });
    }
    
    // Lưu thông tin target để trả về số lượng sau khi xóa
    const { targetType, targetId } = reaction;
    
    // Xóa reaction
    await reaction.remove();
    
    // Lấy số lượng reaction theo loại sau khi xóa
    const counts = await Reaction.aggregate([
      { $match: { targetType, targetId } },
      { $group: { _id: '$reactionType', count: { $sum: 1 } } },
      { $project: { _id: 0, type: '$_id', count: 1 } }
    ]);
    
    // Format lại kết quả
    const result = {};
    counts.forEach(({ type, count }) => {
      result[type] = count;
    });
    
    return res.status(200).json({
      success: true,
      message: 'Đã xóa reaction.',
      counts: result
    });
  } catch (error) {
    console.error('Error deleting reaction:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi xóa reaction.',
      error: error.message
    });
  }
};

/**
 * Lấy các reaction cho video trong một khoảng thời gian
 */
exports.getVideoReactionsByTimestamp = async (req, res) => {
  try {
    const { videoId } = req.params;
    const { startTime, endTime } = req.query;
    
    // Validate videoId
    if (!mongoose.Types.ObjectId.isValid(videoId)) {
      return res.status(400).json({
        success: false,
        message: 'ID video không hợp lệ.'
      });
    }
    
    // Tạo query
    const query = {
      targetType: 'video',
      targetId: videoId
    };
    
    // Thêm điều kiện thời gian nếu có
    if (startTime !== undefined && endTime !== undefined) {
      query['metadata.timeInVideo'] = {
        $gte: parseFloat(startTime),
        $lte: parseFloat(endTime)
      };
    } else if (startTime !== undefined) {
      query['metadata.timeInVideo'] = { $gte: parseFloat(startTime) };
    } else if (endTime !== undefined) {
      query['metadata.timeInVideo'] = { $lte: parseFloat(endTime) };
    }
    
    // Lấy reactions
    const reactions = await Reaction.find(query)
      .populate('userId', 'username avatar')
      .sort({ 'metadata.timeInVideo': 1 });
    
    return res.status(200).json({
      success: true,
      count: reactions.length,
      data: reactions
    });
  } catch (error) {
    console.error('Error fetching video reactions by timestamp:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy reactions.',
      error: error.message
    });
  }
};

/**
 * Lấy reaction heatmap cho video (phân tích mật độ reaction theo thời gian)
 */
exports.getVideoReactionHeatmap = async (req, res) => {
  try {
    const { videoId } = req.params;
    const { interval = 5, reactionType } = req.query;
    
    // Validate videoId
    if (!mongoose.Types.ObjectId.isValid(videoId)) {
      return res.status(400).json({
        success: false,
        message: 'ID video không hợp lệ.'
      });
    }
    
    // Xây dựng query
    const query = {
      targetType: 'video',
      targetId: mongoose.Types.ObjectId(videoId),
      'metadata.timeInVideo': { $exists: true, $ne: null }
    };
    
    // Thêm điều kiện reactionType nếu có
    if (reactionType) {
      query.reactionType = reactionType;
    }
    
    // Lấy video để biết thời lượng
    const VideoContent = mongoose.model('VideoContent');
    const video = await VideoContent.findById(videoId);
    
    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy video.'
      });
    }
    
    const duration = video.duration || 0;
    const intervalSeconds = parseFloat(interval);
    
    // Tạo heatmap
    const heatmap = [];
    
    // Tính số khoảng thời gian
    const numIntervals = Math.ceil(duration / intervalSeconds);
    
    // Khởi tạo mảng heatmap
    for (let i = 0; i < numIntervals; i++) {
      heatmap.push({
        startTime: i * intervalSeconds,
        endTime: Math.min((i + 1) * intervalSeconds, duration),
        count: 0,
        reactions: {}
      });
    }
    
    // Lấy tất cả reaction có timeInVideo
    const reactions = await Reaction.find(query);
    
    // Đếm reaction trong từng khoảng thời gian
    reactions.forEach(reaction => {
      const timeInVideo = reaction.metadata.timeInVideo;
      const intervalIndex = Math.floor(timeInVideo / intervalSeconds);
      
      if (intervalIndex >= 0 && intervalIndex < heatmap.length) {
        heatmap[intervalIndex].count += 1;
        
        // Đếm theo loại reaction
        const type = reaction.reactionType;
        if (!heatmap[intervalIndex].reactions[type]) {
          heatmap[intervalIndex].reactions[type] = 0;
        }
        heatmap[intervalIndex].reactions[type] += 1;
      }
    });
    
    return res.status(200).json({
      success: true,
      videoDuration: duration,
      interval: intervalSeconds,
      data: heatmap
    });
  } catch (error) {
    console.error('Error generating video reaction heatmap:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi tạo heatmap.',
      error: error.message
    });
  }
};

/**
 * Lấy tất cả reaction trong một phòng
 */
exports.getRoomReactions = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { limit = 50, skip = 0 } = req.query;
    
    // Validate roomId
    if (!mongoose.Types.ObjectId.isValid(roomId)) {
      return res.status(400).json({
        success: false,
        message: 'ID phòng không hợp lệ.'
      });
    }
    
    // Lấy reactions
    const reactions = await Reaction.find({ roomId })
      .populate('userId', 'username avatar')
      .sort({ timestamp: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit));
    
    // Đếm tổng số reaction
    const total = await Reaction.countDocuments({ roomId });
    
    return res.status(200).json({
      success: true,
      count: reactions.length,
      total,
      data: reactions
    });
  } catch (error) {
    console.error('Error fetching room reactions:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy reactions trong phòng.',
      error: error.message
    });
  }
};

/**
 * Lấy tất cả reaction của một người dùng
 */
exports.getUserReactions = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50, skip = 0, targetType } = req.query;
    
    // Validate userId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'ID người dùng không hợp lệ.'
      });
    }
    
    // Xây dựng query
    const query = { userId: mongoose.Types.ObjectId(userId) };
    
    // Thêm điều kiện targetType nếu có
    if (targetType && ['message', 'video', 'comment', 'room'].includes(targetType)) {
      query.targetType = targetType;
    }
    
    // Lấy reactions
    const reactions = await Reaction.find(query)
      .sort({ timestamp: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit))
      .populate({
        path: 'targetId',
        select: 'title content name',
        options: { lean: true }
      });
    
    // Đếm tổng số reaction
    const total = await Reaction.countDocuments(query);
    
    return res.status(200).json({
      success: true,
      count: reactions.length,
      total,
      data: reactions
    });
  } catch (error) {
    console.error('Error fetching user reactions:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy reactions của người dùng.',
      error: error.message
    });
  }
};