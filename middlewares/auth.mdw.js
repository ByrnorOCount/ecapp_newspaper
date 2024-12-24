import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcrypt';
import userService from '../services/user.service.js';
import subscriptionService from '../services/subscription.service.js';
import articleService from '../services/article.service.js';

export function restrictToRole(role) {
  return function (req, res, next) {
    if (!req.session.auth || !req.session.authUser) {
      return res.redirect('/login');
    }

    if (req.session.authUser.role !== role && req.session.authUser.role !== 'admin') {
      console.error(`Access denied: user role is ${req.session.authUser?.role}`);
      return res.redirect('/login');
    }

    next();
  };
}

export async function restrictPremium(req, res, next) {
  try {
      const article = await articleService.getArticleById(req.params.id);

      if (!article) {
          return res.status(404).send('Article not found.');
      }

      req.article = article;

      if (article.is_premium) {
          const authUser = req.session.authUser;
          if (!authUser) {
              req.article.content = 'This is premium content. Please sign in and subscribe to view it.';
          } else {
              const isValidSubscription = await subscriptionService.getSubscriptionStatus(authUser.id);

              if (!isValidSubscription) {
                  req.article.content = 'This is premium content. Please subscribe to view it.';
              }
          }
      }
      next();
  } catch (error) {
      console.error("Error in restrictPremium middleware:", error);
      res.redirect('/articles');
  }
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

export async function isSubscriber(req, res, next) {
  if (!req.session.authUser) {
      return res.redirect('/auth/login');
  }

  const userId = req.session.authUser.id;

  const isSubscribed = await subscriptionService.getSubscriptionStatus(userId);
  if (isSubscribed) {
      return next();
  }

  req.flash('error', 'Your subscription has expired. Please renew to access premium content.');
  res.redirect('/profile');
}