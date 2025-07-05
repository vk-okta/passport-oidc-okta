import express from 'express';

import { callbackHandler, ensureAuthenticated, loginHandler, logoutHandler } from './auth.js';

const router = express.Router();

router.get('/', (req, res) => {
  res.render('home', { user: req.user });
});

router.get('/login', loginHandler);

router.get('/authorization-code/callback', callbackHandler);

router.get('/profile', ensureAuthenticated, (req, res) => {
  res.render('profile', { user: req.user.profile });
});

router.get('/logout', logoutHandler);

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
