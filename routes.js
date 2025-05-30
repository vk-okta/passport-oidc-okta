import express from 'express';
import passport from 'passport';

const router = express.Router();

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect('/login');
}

router.get('/', (req, res) => {
  res.render('home', { user: req.user });
});

router.get('/login', passport.authenticate('oidc'));

router.get(
  '/authorization-code/callback',
  passport.authenticate('oidc', { failureRedirect: '/login', failureMessage: true }),
  function (req, res) {
    res.redirect('/profile');
  }
);

router.get('/profile', ensureAuthenticated, (req, res) => {
  res.render('profile', { user: req.user.profile });
});

router.get('/logout', (req, res) => {
  req.logout(() => {
    res.redirect('/');
  });
});

export default router;
