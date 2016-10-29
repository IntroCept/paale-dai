import express from 'express';
import google from 'googleapis';
import denodeify from 'denodeify';
import url from 'url';
import jwt from 'jsonwebtoken';
import appendQuery from 'append-query';
import _ from 'lodash';
import * as stateEncoder from './state-encoder';
import config from './config';

const app = express();
const OAuth2 = google.auth.OAuth2;
const plus = google.plus('v1');

const validateService = (req, res, next) => {
  if (!req.query.service) {
    return res.status(400).send('Redirect service is absent');
  }

  const serviceUrl = url.parse(req.query.service, true);
  if (!_.endsWith(serviceUrl.hostname, 'introcept.co')) {
    return res.status(403).send('Invalid service');
  }

  next();
};


app.get('/', [
  validateService,
  (req, res) => {
    const oauth2Client = new OAuth2(
      config.google.clientId,
      config.google.clientSecret,
      `${req.protocol}://${req.hostname}:${config.port}${config.google.callback}`
    );

    res.redirect(oauth2Client.generateAuthUrl({
      access_type: 'online',
      scope: [
        'https://www.googleapis.com/auth/plus.me',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
      ],
      state: stateEncoder.encode(req.query.service),
    }));
  },
]);

app.get(config.google.callback, [
  (req, res, next) => {
    if (!req.query.state) {
      return res.status(400).send('State absent');
    }

    req.query.service = stateEncoder.decode(req.query.state);

    next();
  },
  validateService,
  (req, res, next) => {
    // just a simple check
    // won't happen in real scenario
    if (!req.query.code) {
      return res.status(400).send('Authorization code is absent');
    }

    const oauth2Client = new OAuth2(
      config.google.clientId,
      config.google.clientSecret,
      `${req.protocol}://${req.hostname}:${config.port}${config.google.callback}`
    );

    denodeify(oauth2Client.getToken).bind(oauth2Client)(req.query.code)
      .then((tokens) => {
        oauth2Client.setCredentials(tokens);
        return denodeify(plus.people.get)({ userId: 'me', auth: oauth2Client });
      }).then((response) => {
        if (response.domain !== 'introcept.co') {
          res.status(403).send('You must have an email address from introcept.co');
          return false;
        }

        return denodeify(jwt.sign)({
          id: response.id,
          displayName: response.displayName,
          name: response.name,
          email: response.emails[0].value,
          image: response.image.url,
        }, config.jwt.key, { algorithm: config.jwt.algorithm, expiresIn: config.jwt.expiresIn });
      }).then((token) => {
        if (!token) return;

        return res.redirect(appendQuery(req.query.service, `token=${token}`));
      })
      .catch(next);
  },
]);

app.get('/me', (req, res, next) => {
  let parts = req.get('Authorization');
  if (!parts) {
    return res.status(401).send({ message: 'Unauthenticated' });
  }

  parts = parts.split(' ');

  if (parts.length !== 2) {
    return res.status(400).send({ message: 'Incorrect Authorization header format' });
  }

  const token = parts[1];

  return denodeify(jwt.verify)(token, config.jwt.pubKey, { algorithm: config.jwt.algorithm })
    .then(decoded => res.status(200).send(decoded))
    .catch((err) => {
      if (err instanceof jwt.TokenExpiredError) {
        return res.status(401).send({ message: 'Token expired', code: config.errorCodes.expiredToken });
      }

      if (err instanceof jwt.JsonWebTokenError) {
        return res.status(401).send({ message: 'Invalid token', code: config.errorCodes.invalidToken });
      }

      next(err);
    });
});

// error handler
app.use((err, req, res, next) => {
  if (!err) return next();

  console.error(err.stack);
  return res.status(500).send({ message: 'Internal Server Error' });
});

export default app;
