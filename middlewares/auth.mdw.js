import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcrypt';
import userService from '../services/user.service.js';

export default function (req, res, next) {
    //tba
    next();
}

export function authAdmin (req, res, next) {
    //tba
    next();
}

passport.use(new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password'
    },
    async function(email, password, done) {
      try {
        const user = await userService.getUserByEmail(email);
        if (!user) {
          return done(null, false, { message: 'Incorrect email.' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          return done(null, false, { message: 'Incorrect password.' });
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
));

passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(async function (id, done) {
  try {
    const user = await userService.getUserById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

export function isAuthenticated (req, res, next) {
    if (req.isAuthenticated()) return next();
    res.redirect('/login');
};
  
export function isRole(role) {
    return function(req, res, next) {
        if (req.isAuthenticated() && req.user.role === role) {
            return next();
        }
        res.status(403).send('Forbidden');
    };
}