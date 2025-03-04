// config/passport.js
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const bcrypt = require('bcryptjs');
const db = require('../models');
const User = db.users;
const Role = db.roles;

module.exports = function() {
  // Thiết lập JWT Strategy
  passport.use(new JwtStrategy({
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET
  }, async (jwtPayload, done) => {
    try {
      // Tìm user theo ID
      const user = await User.findByPk(jwtPayload.id, {
        include: [
          {
            model: Role,
            attributes: ['id', 'name'],
            through: { attributes: [] }
          }
        ]
      });
      
      if (!user) {
        return done(null, false);
      }
      
      if (!user.accountNonLocked) {
        return done(null, false);
      }
      
      return done(null, user);
    } catch (error) {
      return done(error, false);
    }
  }));
  
  // Thiết lập Google OAuth Strategy
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      // Tìm user theo providerId
      let user = await User.findOne({
        where: {
          provider: 'google',
          provider_Id: profile.id
        }
      });
      
      if (!user) {
        // Tạo user mới nếu chưa tồn tại
        const email = profile.emails && profile.emails[0] ? profile.emails[0].value : '';
        const avatar_Url = profile.photos && profile.photos[0] ? profile.photos[0].value : 'https://i.imgur.com/Tr9qnkI.jpeg';
        
        // Kiểm tra email đã đăng ký chưa
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
          // Liên kết tài khoản hiện có với Google
          existingUser.provider = 'google';
          existingUser.provider_Id = profile.id;
          existingUser.avtUrl = avatar_Url;
          await existingUser.save();
          user = existingUser;
        } else {
          // Tạo tài khoản mới
          user = await User.create({
            username: `google_${profile.id}`,
            password: await bcrypt.hash(Math.random().toString(36).substring(2), 10), // Mật khẩu ngẫu nhiên
            email,
            provider: 'google',
            provider_Id: profile.id,
            avt_Url: avatar_Url
          });
          
          // Gán role USER cho tài khoản mới
          const userRole = await Role.findOne({ where: { name: 'ROLE_USER' } });
          if (userRole) {
            await user.addRole(userRole);
          }
        }
      }
      
      // Kiểm tra tài khoản bị khóa
      if (!user.account_Non_Locked) {
        return done(null, false, { message: 'Tài khoản đã bị khóa' });
      }
      
      return done(null, user);
    } catch (error) {
      return done(error, false);
    }
  }));
};