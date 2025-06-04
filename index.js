import express from 'express';
import session from 'express-session';
import passport from 'passport';
import setupOIDC from './auth.js';
import routes from './routes.js';

const app = express();

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: false }));

app.use(session({
  secret: "your-hardcoded-secret",
  resave: false,
  saveUninitialized: true,
}));

app.use(passport.initialize());
app.use(passport.session());

setupOIDC();

app.use('/', routes);

app.listen(process.env.PORT, () => {
  console.log(`Server listening on http://localhost:${process.env.PORT}`);
});