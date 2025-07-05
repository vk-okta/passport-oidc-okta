import * as client from 'openid-client';
import 'dotenv/config';

export async function getClientConfig() {
  return await client.discovery(new URL(process.env.ISSUER), process.env.CLIENT_ID, process.env.CLIENT_SECRET);
}

export async function loginHandler(req, res) {
  try {
    const openIdClientConfig = await getClientConfig();

    const code_verifier = client.randomPKCECodeVerifier();
    const code_challenge = await client.calculatePKCECodeChallenge(code_verifier);

    const state = client.randomState();
    req.session.pkce = { code_verifier, state };
    req.session.save();

    const authUrl = client.buildAuthorizationUrl(openIdClientConfig, {
      scope: 'openid profile email offline_access',
      state,
      code_challenge,
      code_challenge_method: 'S256',
      redirect_uri: process.env.CALLBACK_URL,
    });

    res.redirect(authUrl);
  } catch (error) {
    res.status(500).send('OIDC client is not configured correctly.');
  }
}

export async function callbackHandler(req, res, next) {
  try {
    const openIdClientConfig = await getClientConfig();

    const { pkce } = req.session;

    if (!pkce || !pkce.code_verifier || !pkce.state) {
      throw new Error('Login session expired or invalid. Please try logging in again.');
    }

    const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost';
    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const currentUrl = new URL(`${protocol}://${host}${req.originalUrl}`);

    const tokenSet = await client.authorizationCodeGrant(openIdClientConfig, currentUrl, {
      pkceCodeVerifier: pkce.code_verifier,
      expectedState: pkce.state,
    });

    const { sub, department } = tokenSet.claims();

    const userInfo = await client.fetchUserInfo(openIdClientConfig, tokenSet.access_token, sub);

    const modifiedDepartment =
      department === 'all'
        ? [
            { id: 'd1', label: 'd1' },
            { id: 'd2', label: 'd2' },
            { id: 'd3', label: 'd3' },
          ]
        : [{ id: department.split(' ').join('-').toLowerCase(), label: department }];

    const userProfile = {
      profile: {
        ...userInfo,
        idToken: tokenSet.id_token,
        userGroups: modifiedDepartment,
      },
    };

    delete req.session.pkce;

    req.logIn(userProfile, (err) => {
      if (err) {
        return next(err);
      }
      return res.redirect('/profile');
    });
  } catch (error) {
    console.error('Authentication error:', error.message);
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
