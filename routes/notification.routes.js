const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const auth = require('../middleware/auth');

/**
 * @route   GET /api/notifications
 * @desc    Lấy tất cả thông báo của người dùng
 * @access  Private
 */
router.get('/', auth, notificationController.getNotifications);

/**
 * @route   GET /api/notifications/unread-count
 * @desc    Lấy số lượng thông báo chưa đọc
 * @access  Private
 */
router.get('/unread-count', auth, notificationController.getUnreadCount);

/**
 * @route   PUT /api/notifications/:notificationId/read
 * @desc    Đánh dấu thông báo đã đọc
 * @access  Private
 */
router.put('/:notificationId/read', auth, notificationController.markAsRead);

/**
 * @route   PUT /api/notifications/read-all
 * @desc    Đánh dấu tất cả thông báo đã đọc
 * @access  Private
 */
router.put('/read-all', auth, notificationController.markAllAsRead);

/**
 * @route   DELETE /api/notifications/:notificationId
 * @desc    Xóa thông báo
 * @access  Private
 */
router.delete('/:notificationId', auth, notificationController.deleteNotification);

/**
 * @route   POST /api/notifications
 * @desc    Tạo một thông báo mới (API cho admin hoặc hệ thống)
 * @access  Private/Admin
 */
router.post('/', auth, notificationController.createNotification);

/**
 * @route   POST /api/notifications/room-invite
 * @desc    Tạo thông báo mời tham gia phòng
 * @access  Private
 */
router.post('/room-invite', auth, notificationController.createRoomInvite);

module.exports = router;