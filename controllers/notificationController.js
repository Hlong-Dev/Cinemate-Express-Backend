const Notification = require('../models/notification.model');
const User = require('../models/user.model');
const mongoose = require('mongoose');
const { body, validationResult } = require('express-validator');

/**
 * Lấy tất cả thông báo của người dùng
 */
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Lấy các thông báo có người nhận là user hiện tại, sắp xếp theo thời gian tạo
    const notifications = await Notification.find({
      'recipients.userId': userId
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('sender', 'username avatar')
    .populate('relatedRoom', 'name')
    .populate('relatedVideo', 'title thumbnail');

    // Đếm tổng số thông báo chưa đọc
    const unreadCount = await Notification.countDocuments({
      'recipients.userId': userId,
      'recipients.read': false
    });
    
    // Đếm tổng số thông báo
    const totalCount = await Notification.countDocuments({
      'recipients.userId': userId
    });
    
    return res.status(200).json({
      success: true,
      data: notifications,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
        totalItems: totalCount,
        unreadCount
      }
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy thông báo.',
      error: error.message
    });
  }
};

/**
 * Đánh dấu thông báo đã đọc
 */
exports.markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user._id;
    
    // Tìm thông báo
    const notification = await Notification.findById(notificationId);
    
    // Kiểm tra xem thông báo có tồn tại không
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông báo.'
      });
    }
    
    // Kiểm tra xem người dùng có phải là người nhận thông báo không
    const recipientIndex = notification.recipients.findIndex(
      r => r.userId.toString() === userId.toString()
    );
    
    if (recipientIndex === -1) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền truy cập thông báo này.'
      });
    }
    
    // Đánh dấu là đã đọc
    notification.recipients[recipientIndex].read = true;
    notification.recipients[recipientIndex].readAt = new Date();
    
    await notification.save();
    
    return res.status(200).json({
      success: true,
      message: 'Đã đánh dấu thông báo là đã đọc.',
      data: notification
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi đánh dấu thông báo đã đọc.',
      error: error.message
    });
  }
};

/**
 * Đánh dấu tất cả thông báo đã đọc
 */
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Cập nhật trạng thái đã đọc cho tất cả thông báo của người dùng
    const result = await Notification.updateMany(
      { 
        'recipients.userId': userId,
        'recipients.read': false 
      },
      { 
        $set: { 
          'recipients.$.read': true,
          'recipients.$.readAt': new Date()
        }
      }
    );
    
    return res.status(200).json({
      success: true,
      message: 'Đã đánh dấu tất cả thông báo là đã đọc.',
      count: result.nModified || 0
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi đánh dấu tất cả thông báo đã đọc.',
      error: error.message
    });
  }
};

/**
 * Xóa thông báo
 */
exports.deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user._id;
    
    // Tìm thông báo
    const notification = await Notification.findById(notificationId);
    
    // Kiểm tra xem thông báo có tồn tại không
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông báo.'
      });
    }
    
    // Kiểm tra xem người dùng có phải là người nhận thông báo không
    const isRecipient = notification.recipients.some(
      r => r.userId.toString() === userId.toString()
    );
    
    if (!isRecipient) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xóa thông báo này.'
      });
    }
    
    // Xóa thông báo cho người dùng hiện tại
    await Notification.updateOne(
      { _id: notificationId },
      { $pull: { recipients: { userId: userId } } }
    );
    
    // Nếu không còn người nhận nào, xóa luôn thông báo
    await Notification.deleteOne({
      _id: notificationId,
      recipients: { $size: 0 }
    });
    
    return res.status(200).json({
      success: true,
      message: 'Đã xóa thông báo.'
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi xóa thông báo.',
      error: error.message
    });
  }
};

/**
 * Tạo một thông báo mới (API cho admin hoặc hệ thống)
 */
exports.createNotification = [
  // Validation
  body('type').isIn([
    'room_invite', 'video_added', 'chat_mention', 
    'system_alert', 'user_join', 'user_leave', 'video_sync'
  ]).withMessage('Loại thông báo không hợp lệ.'),
  body('title').notEmpty().withMessage('Tiêu đề không được để trống.'),
  body('message').notEmpty().withMessage('Nội dung không được để trống.'),
  body('recipients').isArray().withMessage('Danh sách người nhận không hợp lệ.'),
  body('recipients.*').isMongoId().withMessage('ID người nhận không hợp lệ.'),
  
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    try {
      const { type, title, message, recipients, relatedRoom, relatedVideo, 
              relatedMessage, priority, actions, icon, isGlobal } = req.body;
      
      // Kiểm tra người nhận có tồn tại không
      const validRecipients = await User.find({ 
        _id: { $in: recipients } 
      }).select('_id');
      
      if (validRecipients.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Không tìm thấy người nhận hợp lệ.'
        });
      }
      
      // Tạo đối tượng thông báo
      const notification = new Notification({
        type,
        title,
        message,
        sender: req.user._id,
        recipients: validRecipients.map(user => ({ userId: user._id })),
        relatedRoom,
        relatedVideo,
        relatedMessage,
        priority: priority || 'normal',
        actions,
        icon,
        isGlobal: isGlobal || false
      });
      
      await notification.save();
      
      return res.status(201).json({
        success: true,
        message: 'Đã tạo thông báo thành công.',
        data: notification
      });
    } catch (error) {
      console.error('Error creating notification:', error);
      return res.status(500).json({
        success: false,
        message: 'Đã xảy ra lỗi khi tạo thông báo.',
        error: error.message
      });
    }
  }
];

/**
 * Tạo thông báo mời tham gia phòng
 */
exports.createRoomInvite = [
  // Validation
  body('roomId').isMongoId().withMessage('ID phòng không hợp lệ.'),
  body('recipients').isArray().withMessage('Danh sách người nhận không hợp lệ.'),
  body('recipients.*').isMongoId().withMessage('ID người nhận không hợp lệ.'),
  body('message').optional(),
  
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    try {
      const { roomId, recipients, message } = req.body;
      const userId = req.user._id;
      
      // Lấy thông tin phòng
      const Room = mongoose.model('Room');
      const room = await Room.findById(roomId);
      
      if (!room) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy phòng.'
        });
      }
      
      // Kiểm tra xem người dùng có quyền mời người khác không
      if (room.createdBy.toString() !== userId.toString() && 
          !room.moderators.includes(userId)) {
        return res.status(403).json({
          success: false,
          message: 'Bạn không có quyền mời người khác vào phòng này.'
        });
      }
      
      // Kiểm tra người nhận có tồn tại không
      const validRecipients = await User.find({ 
        _id: { $in: recipients } 
      }).select('_id');
      
      if (validRecipients.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Không tìm thấy người nhận hợp lệ.'
        });
      }
      
      // Lọc những người đã là thành viên
      const nonMembers = validRecipients.filter(user => 
        !room.members.includes(user._id)
      );
      
      if (nonMembers.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Tất cả người nhận đã là thành viên trong phòng.'
        });
      }
      
      // Tạo lời mời cho từng người
      const invites = await Promise.all(
        nonMembers.map(async (user) => {
          return Notification.createRoomInvite(userId, user._id, room, message);
        })
      );
      
      return res.status(201).json({
        success: true,
        message: `Đã gửi lời mời đến ${invites.length} người.`,
        data: invites
      });
    } catch (error) {
      console.error('Error creating room invites:', error);
      return res.status(500).json({
        success: false,
        message: 'Đã xảy ra lỗi khi tạo lời mời.',
        error: error.message
      });
    }
  }
];

/**
 * Lấy số lượng thông báo chưa đọc
 */
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const count = await Notification.countDocuments({
      'recipients.userId': userId,
      'recipients.read': false
    });
    
    return res.status(200).json({
      success: true,
      unreadCount: count
    });
  } catch (error) {
    console.error('Error counting unread notifications:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi đếm thông báo chưa đọc.',
      error: error.message
    });
  }
};