const db = require('../models');
const Movie = db.movies;

const movieSeedData = [
  {
    title: 'Inception',
    original_title: 'Inception',
    description: 'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.',
    genre: 'Sci-Fi',
    release_year: 2010,
    duration: 148,
    poster_url: 'https://example.com/inception-poster.jpg',
    trailer_url: 'https://example.com/inception-trailer',
    rating: 8.8,
    directors: 'Christopher Nolan',
    actors: 'Leonardo DiCaprio, Joseph Gordon-Levitt, Ellen Page'
  },
  {
    title: 'The Shawshank Redemption',
    original_title: 'The Shawshank Redemption',
    description: 'Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.',
    genre: 'Drama',
    release_year: 1994,
    duration: 142,
    poster_url: 'https://example.com/shawshank-poster.jpg',
    trailer_url: 'https://example.com/shawshank-trailer',
    rating: 9.3,
    directors: 'Frank Darabont',
    actors: 'Tim Robbins, Morgan Freeman, Bob Gunton'
  },
  {
    title: 'The Dark Knight',
    original_title: 'The Dark Knight',
    description: 'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.',
    genre: 'Action',
    release_year: 2008,
    duration: 152,
    poster_url: 'https://example.com/dark-knight-poster.jpg',
    trailer_url: 'https://example.com/dark-knight-trailer',
    rating: 9.0,
    directors: 'Christopher Nolan',
    actors: 'Christian Bale, Heath Ledger, Aaron Eckhart'
  },
  {
    title: 'Pulp Fiction',
    original_title: 'Pulp Fiction',
    description: 'The lives of two mob hitmen, a boxer, a gangster and his wife, and a pair of diner bandits intertwine in four tales of violence and redemption.',
    genre: 'Crime',
    release_year: 1994,
    duration: 154,
    poster_url: 'https://example.com/pulp-fiction-poster.jpg',
    trailer_url: 'https://example.com/pulp-fiction-trailer',
    rating: 8.9,
    directors: 'Quentin Tarantino',
    actors: 'John Travolta, Uma Thurman, Samuel L. Jackson'
  },
  {
    title: 'Forrest Gump',
    original_title: 'Forrest Gump',
    description: 'The presidencies of Kennedy and Johnson, the Vietnam War, the Watergate scandal and other historical events unfold from the perspective of an Alabama man with an IQ of 75, whose only desire is to be reunited with his childhood sweetheart.',
    genre: 'Drama',
    release_year: 1994,
    duration: 142,
    poster_url: 'https://example.com/forrest-gump-poster.jpg',
    trailer_url: 'https://example.com/forrest-gump-trailer',
    rating: 8.8,
    directors: 'Robert Zemeckis',
    actors: 'Tom Hanks, Robin Wright, Gary Sinise'
  }
];

// Hàm seed data
async function seedMovies() {
  try {
    // Xóa dữ liệu cũ
    await Movie.destroy({ where: {} });

    // Thêm dữ liệu mới
    const createdMovies = await Movie.bulkCreate(movieSeedData, {
      ignoreDuplicates: true
    });

    console.log(`Đã seed thành công ${createdMovies.length} movies`);
  } catch (error) {
    console.error('Lỗi khi seed movies:', error);
  }
}

// Hàm để chạy seed (có thể gọi từ CLI hoặc script khác)
async function runMovieSeed() {
  try {
    await db.sequelize.sync(); // Đảm bảo các bảng đã được tạo
    await seedMovies();
    await db.sequelize.close(); // Đóng kết nối sau khi seed
  } catch (error) {
    console.error('Lỗi khi chạy seed:', error);
    process.exit(1);
  }
}

// Xuất các hàm để có thể sử dụng
module.exports = {
  seedMovies,
  runMovieSeed
};

// Nếu muốn chạy trực tiếp từ file này
if (require.main === module) {
  runMovieSeed();
}