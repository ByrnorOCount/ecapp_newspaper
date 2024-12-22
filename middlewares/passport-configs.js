import db from '../utils/db.js';
import bcrypt from 'bcrypt';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import userService from '../services/user.service.js';

passport.use(new LocalStrategy(async function (username, password, done) {
    try {
      const user = await userService.findByEmail(username);
      if (!user) return done(null, false, { message: 'Incorrect email.' });
  
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return done(null, false, { message: 'Incorrect password.' });
  
      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }));

passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(async function (id, done) {
    const user = await userService.findById(id);
    done(null, user);
});

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/google/callback'
  }, async function (token, tokenSecret, profile, done) {
    try {
      let user = await userService.findByEmail(profile.emails[0].value);
      if (!user) {
        user = await userService.registerGoogleUser(profile.displayName, profile.emails[0].value);
      }
      done(null, user);
    } catch (error) {
      done(error);
    }
  }));