// routes/room.routes.js
const express = require('express');
const router = express.Router();
const roomController = require('../controllers/room.controller');

// Bỏ middleware verifyToken, requireAuth
router.get('/', roomController.getAllRooms);
router.get('/:id', roomController.getRoomById);
router.post('/', roomController.createRoom);
router.delete('/:id', roomController.deleteRoom);
router.post('/:roomId/update-video', roomController.updateRoomVideo);

module.exports = router;