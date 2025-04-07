const express = require('express');
const movieController = require('../controllers/movie.controller');
const router = express.Router();

// Middleware xác thực (ví dụ)
const authenticateUser = (req, res, next) => {
  // Logic xác thực người dùng
  next();
};

// Middleware kiểm tra quyền admin
const requireAdmin = (req, res, next) => {
  // Logic kiểm tra quyền admin
  next();
};

// Các route cho movie
router.post('/', authenticateUser, requireAdmin, movieController.createMovie);
router.get('/', movieController.getAllMovies);
router.get('/search', movieController.searchMovies);
router.get('/:id', movieController.getMovieById);
router.put('/:id', authenticateUser, requireAdmin, movieController.updateMovie);
router.delete('/:id', authenticateUser, requireAdmin, movieController.deleteMovie);

module.exports = router;