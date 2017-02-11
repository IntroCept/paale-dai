const express = require('express');
const paale = require('../');
const handler = require('../handler/google-oauth2');
const cookies = require('cookies');
const jwtStorage = require('../storage/jwt');

const app = express();
app.use(cookies.express());

app.use(paale(
  handler(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    [
      'https://www.googleapis.com/auth/plus.me',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
    ]
  ),
  jwtStorage({ key: process.env.JWT_KEY, pubKey: process.env.JWT_KEY, algorithm: 'HS256' }),
  {
    identityPath: '/me',
    callbackPath: '/google-callback',
    useCookie: true,
  }
));

app.get('/health-check', (req, res) => {
  res.status(200).send({ message: 'All is well!' });
});

const listener = app.listen(process.env.PORT || 3000, process.env.HOST || '0.0.0.0', () => {
  /* eslint-disable no-console */
  console.log(`pale-dai listening on port ${listener.address().port}`);
});
