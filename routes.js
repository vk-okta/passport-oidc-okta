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

router.get('/authorization-code/callback', (req, res, next) => {
  passport.authenticate('oidc', (err, user, info) => {
    if (err) {
      console.error('Authentication error:', err);
      return res.status(500).send('Authentication failed');
    }
    if (!user) {
      console.warn('No user returned:', info);
      return res.redirect('/login');
    }

    req.logIn(user, (loginErr) => {
      if (loginErr) {
        console.error('Login error:', loginErr);
        return res.redirect('/login');
      }

      return res.redirect('/profile');
    });
  })(req, res, next);
});

router.get('/profile', ensureAuthenticated, (req, res) => {
  res.render('profile', { user: req.user.profile });
});

router.get('/logout', (req, res) => {
  const id_token_hint = req.user?.profile.idToken;

  req.logout(() => {
    req.session.destroy(() => {
      const logoutUrl = `${process.env.ISSUER}/oauth2/v1/logout?id_token_hint=${id_token_hint}&post_logout_redirect_uri=${process.env.POST_LOGOUT_URL}`;
      res.redirect(logoutUrl);
    });
  });
});

router.get('/groups/:id', (req, res) => {
  const groupId = req.params.id;

  const userGroups = req.user?.profile?.userGroups || [];

  const group = userGroups.find((element) => element.id === groupId);

  if (!group) {
    return res.status(404).send('Group not found');
  }

  res.render('groupPage', { group });
});

export default router;
