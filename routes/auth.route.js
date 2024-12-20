import express from 'express';
import passport from 'passport';
import bcrypt from 'bcrypt';

const router = express.Router();

router.get('/register', function (req, res) {
    res.render('account/register');
});

router.post('/register', async function (req, res) {
  const { full_name, pen_name, email, password } = req.body;

  try {
      const hashedPassword = bcrypt.hashSync(password, 10);
      const user = await userService.create({
          full_name,
          pen_name,
          email,
          password: hashedPassword,
      }); // user needs to login after registration
      req.flash('success', 'Registration successful! Please log in.');
      res.redirect('/login');
  } catch (error) {
      req.flash('error', 'Email already in use or invalid data.');
      res.redirect('/register');
  }
});

router.get('/login', function (req, res) {
    res.render('account/login', { message: req.flash() });
});

router.post('/login', passport.authenticate('local', {
    failureRedirect: '/login',
    failureFlash: true,
  }), async function (req, res) {
      req.session.auth = true;
      req.session.authUser = req.user;
      const retUrl = req.session.retUrl || '/';
      res.redirect(retUrl);      
});

router.post('/logout', function (req, res) {
  req.session.auth = false;
  req.session.authUser = null;
  req.logout(res.redirect(req.headers.refere || '/'));
});

router.get('/profile', function (req, res) {
  if (!req.isAuthenticated()) {
    req.flash('error', 'You must be logged in to view your profile.');
    return res.redirect('/login');
  }
  res.render('account/profile', { 
      user: req.session.user
    });
});

router.get('/google', passport.authenticate('google', { scope: ['email', 'profile'] }));
router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  function (req, res) {
  res.redirect('/');
  }
);

export default router;