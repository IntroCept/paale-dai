'use strict';

import express from 'express';
import config from './config';
import google from 'googleapis';
import denodeify from 'denodeify';
import url from 'url';
import jwt from 'jsonwebtoken';
import * as stateEncoder from './state-encoder';
import appendQuery from 'append-query';
import _ from 'lodash';

const app = express();
const OAuth2 = google.auth.OAuth2;
const plus = google.plus('v1');

const validateService = function (req, res, next) {
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
  function (req, res) {
    const oauth2Client = new OAuth2(
      config.google.clientId,
      config.google.clientSecret,
      req.protocol + '://' + req.hostname + ':' + config.port + config.google.callback
    );

    res.redirect(oauth2Client.generateAuthUrl({
      access_type: 'online',
      scope: ['https://www.googleapis.com/auth/plus.me', 'https://www.googleapis.com/auth/userinfo.email'],
      state: stateEncoder.encode(req.query.service)
    }));
  }
]);

app.get(config.google.callback, [
  function (req, res, next) {
    if (!req.query.state) {
      return res.status(400).send('State absent');
    }

    req.query.service = stateEncoder.decode(req.query.state);

    next();
  },
  validateService,
  function (req, res, next) {
    // just a simple check
    // won't happen in real scenario
    if (!req.query.code) {
      return res.status(400).send('Authorization code is absent');
    }

    const oauth2Client = new OAuth2(
      config.google.clientId,
      config.google.clientSecret,
      req.protocol + '://' + req.hostname + ':' + config.port + config.google.callback
    );

    denodeify(oauth2Client.getToken).bind(oauth2Client)(req.query.code)
      .then(function (tokens) {
        oauth2Client.setCredentials(tokens);
        return denodeify(plus.people.get)({userId: 'me', auth: oauth2Client });
      }).then(function(response) {
        if (response.domain !== 'introcept.co') {
          res.status(403).send('You must have an email address from introcept.co');
          return false;
        }

        return denodeify(jwt.sign)({
          email: response.emails[0].value
        }, config.jwt.key, {algorithm: 'RS256', expiresIn: config.jwt.expiresIn});

      }).then(function(token) {
        if (!token) return;

        return res.redirect(appendQuery(req.query.service, 'token=' + token));
      }).catch(next);
  }
]);

export default app;