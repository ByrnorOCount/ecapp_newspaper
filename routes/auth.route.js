import express from 'express';
import passport from 'passport';

const router = express.Router();

router.get('/login', (req, res) => {
    res.render('guest/home', { error: req.flash('error') });
});

router.post('/login', passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/login',
  failureFlash: true
}));

router.get('/google', passport.authenticate('google', { scope: ['email', 'profile'] }));
router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  function (req, res) {
  res.redirect('/');
  }
);

router.post('/logout', function (req, res) {
    req.logout(function() {
      res.redirect(req.headers.referer);
    });
});

export default router;