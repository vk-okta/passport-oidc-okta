import passport from 'passport';
import { Strategy as OIDCStrategy } from 'passport-openidconnect';

function setupOIDC() {
  const clientId = '0oaa48i18zglra7K41d7';
  const clientSecret = 'y2lgSLa-zd8LTAiSPdKh4idxY32Gv7B20UDyV_WCVopWvYR87ZdXtpytZ0f3xm6q';

  passport.use(
    'oidc',
    new OIDCStrategy(
      {
        issuer: 'https://vivek-giri.oktapreview.com/oauth2/ausae177jfbCM7LBp1d7',
        authorizationURL: 'https://vivek-giri.oktapreview.com/oauth2/ausae177jfbCM7LBp1d7/v1/authorize',
        tokenURL: 'https://vivek-giri.oktapreview.com/oauth2/ausae177jfbCM7LBp1d7/v1/token',
        userInfoURL: 'https://vivek-giri.oktapreview.com/oauth2/ausae177jfbCM7LBp1d7/v1/userinfo',
        clientID: clientId,
        clientSecret: clientSecret,
        callbackURL: 'http://localhost:8080/authorization-code/callback',
        scope: 'openid profile email offline_access',
      },
      function (issuer, profile, context, idToken, accessToken, refreshToken, done) {
        console.log('idToken', idToken);
        console.log('accessToken', accessToken);
        console.log('refreshToken', refreshToken);

        profile.accessToken = accessToken;
        profile.idToken = idToken;
        profile.refreshToken = profile.refreshToken;

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
