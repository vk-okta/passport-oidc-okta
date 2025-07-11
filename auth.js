import * as client from 'openid-client';
import 'dotenv/config';

async function getClientConfig() {
  return await client.discovery(new URL(process.env.ISSUER), process.env.CLIENT_ID, process.env.CLIENT_SECRET);
}

function getCallbackUrlWithParams(req) {
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost';
  const protocol = req.headers['x-forwarded-proto'] || req.protocol;
  const currentUrl = new URL(`${protocol}://${host}${req.originalUrl}`);

  return currentUrl;
}

function getModifiedDepartment(departmentVal) {
  return departmentVal?.trim()
    ? departmentVal === 'all'
      ? [
          { id: 'd1', label: 'd1' },
          { id: 'd2', label: 'd2' },
          { id: 'd3', label: 'd3' },
        ]
      : [{ id: departmentVal.split(' ').join('-').toLowerCase(), label: departmentVal.trim() }]
    : [];
}

export async function loginHandler(req, res) {
  try {
    const openIdClientConfig = await getClientConfig();

    const code_verifier = client.randomPKCECodeVerifier();
    const code_challenge = await client.calculatePKCECodeChallenge(code_verifier);

    const state = client.randomState();
    req.session.pkceData = { code_verifier, state };
    req.session.save();

    const authUrl = client.buildAuthorizationUrl(openIdClientConfig, {
      scope: 'openid email profile offline_access',
      state,
      code_challenge,
      code_challenge_method: 'S256',
      redirect_uri: process.env.CALLBACK_URL,
    });

    res.redirect(authUrl);
  } catch (error) {
    res.status(500).send('Something failed during the authorization request');
  }
}

export async function callbackHandler(req, res, next) {
  try {
    const openIdClientConfig = await getClientConfig();

    const { pkceData } = req.session;

    if (!pkceData || !pkceData.code_verifier || !pkceData.state) {
      throw new Error('Login session expired or invalid. Please try logging in again.');
    }

    const tokenSet = await client.authorizationCodeGrant(openIdClientConfig, getCallbackUrlWithParams(req), {
      pkceCodeVerifier: pkceData.code_verifier,
      expectedState: pkceData.state,
    });

    const { sub } = tokenSet.claims();

    const userInfo = await client.fetchUserInfo(openIdClientConfig, tokenSet.access_token, sub);
    console.log(userInfo)
    const departmentVal = userInfo.department || '';

    const userProfile = {
      profile: {
        ...userInfo,
        idToken: tokenSet.id_token,
        userGroups: getModifiedDepartment(departmentVal),
      },
    };

    console.log(tokenSet)

    delete req.session.pkceData;

    /*
      When you call req.logIn(user):
      It calls the passport.serializeUser() function to determine what gets stored in the session.
      That data is then later used by passport.deserializeUser() to rebuild req.user on each request.
    */

    req.logIn(userProfile, (err) => {
      if (err) {
        return next(err);
      }
      return res.redirect('/profile');
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send(`Authentication failed: ${error.message}`);
  }
}

export function logoutHandler(req, res) {
  const id_token_hint = req.user?.profile?.idToken;

  const logoutUrl = `${process.env.ISSUER}/v1/logout?id_token_hint=${id_token_hint}&post_logout_redirect_uri=${process.env.POST_LOGOUT_URL}`;

  req.logout(() => {
    req.session.destroy(() => {
      res.redirect(logoutUrl);
    });
  });
}

export function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect('/login');
}
