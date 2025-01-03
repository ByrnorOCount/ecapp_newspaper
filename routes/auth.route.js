import express from 'express';
import passport from 'passport';
import bcrypt from 'bcrypt';
import { isAuthenticated } from '../middlewares/auth.mdw.js';
import userService from '../services/user.service.js';
import otpService from '../services/otp.service.js';
import subscriptionService from '../services/subscription.service.js';

const router = express.Router();

router.get('/register', function (req, res) {
    res.render('account/register');
});

router.post('/register', async function (req, res) {
    const { full_name, pen_name, email, password, date_of_birth } = req.body;
  
    try {
        const hashedPassword = bcrypt.hashSync(password, 10);
        const user = await userService.registerUser({
            fullName: full_name,
            penName: pen_name,
            email,
            hashedPassword,
            role: 'reader',
            date_of_birth,
        }); 
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
  }), function (req, res) {
      req.session.auth = true;
      req.session.authUser = req.user;

      const redirectUrl = req.session.previousPage || '/';
      delete req.session.previousPage; 
      res.redirect(redirectUrl);
});

router.post('/logout', isAuthenticated, function (req, res, next) {
  req.logout(function (error) {
    if (error) { return next(error); }
    req.session.auth = false;
    req.session.authUser = null;
    res.redirect(req.headers.referer);
  });
});

router.get('/profile', isAuthenticated, function (req, res) {
  if (!req.isAuthenticated()) {
    req.flash('error', 'You must be logged in to view your profile.');
    return res.redirect('/login');
  }
  res.render('account/profile', { 
      user: req.session.user
    });
});

router.get('/google', passport.authenticate('google', { 
  scope: ['email', 'profile'] 
}));
router.get('/google/callback', passport.authenticate('google', {
  failureRedirect: '/login' 
  }), function (req, res) {
  req.session.auth = true;
  req.session.authUser = req.user;

  const redirectUrl = req.session.returnTo || '/';
  delete req.session.returnTo;
  res.redirect(redirectUrl);
});

router.post('/forgot-password', async function (req, res) {
    const { email } = req.body;

    try {
        const user = await userService.findByEmail(email);
        if (!user) {
            return res.status(404).send('User not found.');
        }

        const otp = otpService.generateOtp();
        await otpService.sendOtpEmail(email, otp);
        req.session.otp = otp;
        req.session.email = email;

        res.render('account/verify-otp', { email });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error sending OTP.');
    }
});

router.post('/verify-otp', async function (req, res) {
    const { otp, new_password } = req.body;
    const { email } = req.session;

    if (otp !== req.session.otp) {
        return res.status(400).send('Invalid OTP.');
    }

    try {
        const hashedPassword = await bcrypt.hash(new_password, 10);
        await userService.updatePasswordByEmail(email, hashedPassword);

        delete req.session.otp;
        delete req.session.email;

        res.redirect('/login');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error resetting password.');
    }
});

router.post('/profile/change-password', isAuthenticated, async function (req, res) {
  const { current_password, new_password } = req.body;
  const userId = req.session.authUser.id;

  try {
      await userService.updatePassword(userId, current_password, new_password);
      req.flash('success', 'Successfully changed password!');
      res.redirect('/profile');
  } catch (error) {
      console.error(error);
      res.status(500).send('Error updating password.');
  }
});

router.post('/profile/update-info', isAuthenticated, async function (req, res) {
  const { full_name, pen_name, email, date_of_birth } = req.body;
  const userId = req.session.authUser.id;

  try {
      await userService.updateUserInfo(userId, {
          full_name,
          pen_name,
          email,
          date_of_birth,
      });
      req.session.authUser = await userService.findById(userId); // refresh session user
      res.redirect('/profile');
  } catch (err) {
      console.error(err);
      res.status(500).send('Error updating information.');
  }
});

router.post('/profile/subscribe', async function (req, res) {
    try {
        const userId = req.session.authUser.id;
        const validUntil = await subscriptionService.subscribe(userId);

        req.session.authUser.valid_until = validUntil; // Update session
        req.flash('success', 'Subscription successfully started!');
        res.redirect('/profile');
    } catch (err) {
        console.error(err);
        req.flash('error', 'Could not start subscription. Please try again.');
        res.redirect('/profile');
    }
});

router.post('/profile/extend', async function (req, res) {
    try {
        const userId = req.session.authUser.id;
        const validUntil = await subscriptionService.extendSubscription(userId);

        req.session.authUser.valid_until = validUntil; // Update session
        req.flash('success', 'Subscription extended!');
        res.redirect('/profile');
    } catch (err) {
        console.error(err);
        req.flash('error', 'Could not extend subscription. Please try again.');
        res.redirect('/profile');
    }
});

router.post('/profile/unsubscribe', async function (req, res) {
    try {
        const userId = req.session.authUser.id;
        await subscriptionService.unsubscribe(userId);

        req.session.authUser.valid_until = null; // Update session
        req.flash('success', 'Unsubscribed successfully!');
        res.redirect('/profile');
    } catch (err) {
        console.error(err);
        req.flash('error', 'Could not unsubscribe. Please try again.');
        res.redirect('/profile');
    }
});

export default router;