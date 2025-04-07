const express = require('express');
const router = express.Router();
const reactionController = require('../controllers/reactionController');
const auth = require('../middleware/auth');

/**
 * @route   GET /api/reactions/:targetType/:targetId
 * @desc    Lấy tất cả reaction cho một đối tượng cụ thể
 * @access  Public
 */
router.get('/:targetType/:targetId', reactionController.getReactionsByTarget);

/**
 * @route   GET /api/reactions/:targetType/:targetId/counts
 * @desc    Lấy tổng số reaction theo từng loại cho một đối tượng
 * @access  Public
 */
router.get('/:targetType/:targetId/counts', reactionController.getReactionCounts);

/**
 * @route   POST /api/reactions
 * @desc    Thêm hoặc xóa một reaction
 * @access  Private
 */
router.post('/', auth, reactionController.toggleReaction);

/**
 * @route   GET /api/reactions/:targetType/:targetId/me
 * @desc    Lấy reaction của người dùng hiện tại cho một đối tượng
 * @access  Private
 */
router.get('/:targetType/:targetId/me', auth, reactionController.getUserReaction);

/**
 * @route   DELETE /api/reactions/:reactionId
 * @desc    Xóa reaction
 * @access  Private
 */
router.delete('/:reactionId', auth, reactionController.deleteReaction);

/**
 * @route   GET /api/reactions/videos/:videoId/timestamps
 * @desc    Lấy các reaction cho video trong một khoảng thời gian
 * @access  Public
 */
router.get('/videos/:videoId/timestamps', reactionController.getVideoReactionsByTimestamp);

/**
 * @route   GET /api/reactions/videos/:videoId/heatmap
 * @desc    Lấy reaction heatmap cho video
 * @access  Public
 */
router.get('/videos/:videoId/heatmap', reactionController.getVideoReactionHeatmap);

/**
 * @route   GET /api/reactions/rooms/:roomId
 * @desc    Lấy tất cả reaction trong một phòng
 * @access  Public
 */
router.get('/rooms/:roomId', reactionController.getRoomReactions);

/**
 * @route   GET /api/reactions/users/:userId
 * @desc    Lấy tất cả reaction của một người dùng
 * @access  Public
 */
router.get('/users/:userId', reactionController.getUserReactions);

module.exports = router;