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
  const id_token_hint = req.user?.profile.idToken
  
  req.logout(() => {
    req.session.destroy(() => {
      const logoutUrl = `https://vivek-giri.oktapreview.com/oauth2/ausae177jfbCM7LBp1d7/v1/logout?id_token_hint=${id_token_hint}&post_logout_redirect_uri=http://localhost:8080`;
      res.redirect(logoutUrl);
    });
  });
});

export default router;
