import passport from 'passport';
import { Strategy as OIDCStrategy } from 'passport-openidconnect';
import jwt from 'jsonwebtoken';
import 'dotenv/config'

function setupOIDC() {

  passport.use(
    'oidc',
    new OIDCStrategy(
      {
        issuer: process.env.ISSUER,
        authorizationURL: `${process.env.ISSUER}/oauth2//v1/authorize`,
        tokenURL: `${process.env.ISSUER}/oauth2/v1/token`,
        userInfoURL: `${process.env.ISSUER}/oauth2/v1/userinfo`,
        clientID: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        callbackURL: process.env.CALLBACK_URL,
        scope: 'openid profile email offline_access groups',
      },
      function (issuer, profile, context, idToken, accessToken, refreshToken, done) {
        profile.accessToken = accessToken;
        profile.idToken = idToken;
        profile.refreshToken = refreshToken;

        const decoded = jwt.decode(idToken)
        // adding groups from ID Token in profile object
        profile.userGroups = decoded.groups

        console.dir(profile, { depth: null });

        return done(null, { profile });
      }
    )
  );

  passport.serializeUser(function (user, done) {
    done(null, user);
  });
  passport.deserializeUser(function (obj, done) {
    done(null, obj);
  });
}

export default setupOIDC;
