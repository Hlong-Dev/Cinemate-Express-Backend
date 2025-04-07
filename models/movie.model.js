// 1. models/movie.model.js
module.exports = (sequelize, DataTypes) => {
    const Movie = sequelize.define('movies', {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          notEmpty: true
        }
      },
      original_title: {
        type: DataTypes.STRING
      },
      description: {
        type: DataTypes.TEXT
      },
      genre: {
        type: DataTypes.STRING
      },
      release_year: {
        type: DataTypes.INTEGER,
        validate: {
          min: 1900,
          max: new Date().getFullYear()
        }
      },
      duration: {
        type: DataTypes.INTEGER,
        validate: {
          min: 0
        }
      },
      poster_url: {
        type: DataTypes.STRING,
        validate: {
          isUrl: true
        }
      },
      trailer_url: {
        type: DataTypes.STRING,
        validate: {
          isUrl: true
        }
      },
      rating: {
        type: DataTypes.FLOAT,
        defaultValue: 0,
        validate: {
          min: 0,
          max: 10
        }
      },
      directors: {
        type: DataTypes.STRING
      },
      actors: {
        type: DataTypes.TEXT
      }
    }, {
      timestamps: true,
      tableName: 'movies',
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci'
    });
  
    return Movie;
  };