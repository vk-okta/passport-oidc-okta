import passport from 'passport';
import { Strategy as OIDCStrategy } from 'passport-openidconnect';
import jwt from 'jsonwebtoken';
import 'dotenv/config';

function setupOIDC() {
  const splitArray = process.env.ISSUER.split('/oauth2').filter(Boolean);

  // if splitArray size is greater than 1 -> custom Auth Server was used
  // org Server -> issuer: https://vivek-giri.oktapreview.com
  // custom auth server -> issuer: https://vivek-giri.oktapreview.com/oauth2/default

  // For Org Auth Server, remove the /oauth2 just from the issuer URL
  const issuer = splitArray.length > 1 ? process.env.ISSUER : process.env.ISSUER.split('/oauth2')[0];

  passport.use(
    'oidc',
    new OIDCStrategy(
      {
        issuer: issuer,
        authorizationURL: `${process.env.ISSUER}/v1/authorize`,
        tokenURL: `${process.env.ISSUER}/v1/token`,
        userInfoURL: `${process.env.ISSUER}/v1/userinfo`,
        clientID: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        callbackURL: process.env.CALLBACK_URL,
        scope: 'openid profile email offline_access',
      },
      function (issuer, profile, context, idToken, accessToken, refreshToken, done) {
        profile.accessToken = accessToken;
        profile.idToken = idToken;
        profile.refreshToken = refreshToken;

        const decoded = jwt.decode(accessToken);
        const departmentVal = decoded.employeeDepartment;

        // modifying the Groups array to object to have ids & label
        // ["Groups 1", "Group Admin"] --> [{id: "groups1", label: "Groups1"}, {id: "groupAdmin", label: "Group Admin"}]
        // const modifiedGroups = decoded?.groups?.map((element) => {
        //   return {
        //     label: element,
        //     id: element.split(' ').join('-').toLowerCase(),
        //   };
        // });

        // if dept value equals to "d1" change it to [{id: 'd1", label: "d1"}]
        // if dept value equals to "all" change it to [{id: 'd1", label: "d1"}, {id: 'd2", label: "d2"}, {id: 'd3", label: "d3"}]
        const modifiedDepartment =
          departmentVal === 'all'
            ? [
                { id: 'd1', label: 'd1' },
                { id: 'd2', label: 'd2' },
                { id: 'd3', label: 'd3' },
              ]
            : [{ id: departmentVal.split(' ').join('-').toLowerCase(), label: departmentVal }];

        profile.userGroups = modifiedDepartment;

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
