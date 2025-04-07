const { Op } = require('sequelize');
const db = require('../models');
const Movie = db.movies;

class MovieController {
  // Tạo phim mới
  async createMovie(req, res) {
    try {
      const movieData = req.body;
      const movie = await Movie.create(movieData);
      res.status(201).json({
        message: 'Movie created successfully',
        data: movie
      });
    } catch (error) {
      res.status(400).json({
        message: 'Error creating movie',
        error: error.message
      });
    }
  }

  // Lấy tất cả phim
  async getAllMovies(req, res) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        genre, 
        minRating, 
        releaseYear 
      } = req.query;

      const offset = (page - 1) * limit;
      
      const whereCondition = {};
      if (genre) whereCondition.genre = genre;
      if (minRating) whereCondition.rating = { [Op.gte]: parseFloat(minRating) };
      if (releaseYear) whereCondition.release_year = releaseYear;

      const { count, rows: movies } = await Movie.findAndCountAll({
        where: whereCondition,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['createdAt', 'DESC']]
      });

      res.status(200).json({
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        data: movies
      });
    } catch (error) {
      res.status(500).json({
        message: 'Error fetching movies',
        error: error.message
      });
    }
  }

  // Lấy phim theo ID
  async getMovieById(req, res) {
    try {
      const { id } = req.params;
      const movie = await Movie.findByPk(id);
      
      if (!movie) {
        return res.status(404).json({
          message: 'Movie not found'
        });
      }

      res.status(200).json(movie);
    } catch (error) {
      res.status(500).json({
        message: 'Error fetching movie',
        error: error.message
      });
    }
  }

  // Cập nhật phim
  async updateMovie(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Tìm movie trước
      const movie = await Movie.findByPk(id);

      if (!movie) {
        return res.status(404).json({
          message: 'Movie not found'
        });
      }

      // Cập nhật movie
      const updatedMovie = await movie.update(updateData);

      res.status(200).json({
        message: 'Movie updated successfully',
        data: updatedMovie
      });
    } catch (error) {
      console.error('Update Movie Error:', error);
      res.status(400).json({
        message: 'Error updating movie',
        error: error.message
      });
    }
  }

  // Xóa phim
  async deleteMovie(req, res) {
    try {
      const { id } = req.params;
      const deletedRowCount = await Movie.destroy({
        where: { id }
      });

      if (deletedRowCount === 0) {
        return res.status(404).json({
          message: 'Movie not found'
        });
      }

      res.status(200).json({
        message: 'Movie deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        message: 'Error deleting movie',
        error: error.message
      });
    }
  }

  // Tìm kiếm phim
  async searchMovies(req, res) {
    try {
      const { query, genre, minRating } = req.query;

      const whereCondition = {};
      if (query) {
        whereCondition[Op.or] = [
          { title: { [Op.like]: `%${query}%` } },
          { original_title: { [Op.like]: `%${query}%` } },
          { directors: { [Op.like]: `%${query}%` } },
          { actors: { [Op.like]: `%${query}%` } }
        ];
      }
      if (genre) whereCondition.genre = genre;
      if (minRating) whereCondition.rating = { [Op.gte]: parseFloat(minRating) };

      const movies = await Movie.findAll({
        where: whereCondition,
        order: [['rating', 'DESC']],
        limit: 50
      });

      res.status(200).json(movies);
    } catch (error) {
      res.status(500).json({
        message: 'Error searching movies',
        error: error.message
      });
    }
  }
}

module.exports = new MovieController();