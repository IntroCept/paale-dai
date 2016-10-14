'use strict';

import express from 'express';
import config from './config';
import google from 'googleapis';
import denodeify from 'denodeify';
import url from 'url';
import jwt from 'jsonwebtoken';
import base64url from 'base64-url';
import appendQuery from 'append-query';

const app = express();
const OAuth2 = google.auth.OAuth2;
const plus = google.plus('v1');

const encodeServiceState = function (req) {
  return base64url.encode(JSON.stringify({service: req.query.service}));
};

const decodeServiceState = function (req) {
  if (!req.query.state) {
    throw new Error('State absent');
  }
  return JSON.parse(base64url.decode(req.query.state)).service;
};

const validateService = function (req, res, next) {
  if (!req.query.service) {
    return res.send('Redirect service is absent');
  }

  const serviceUrl = url.parse(req.query.service, true);

  // check if domains ends with introcept.co
  const domains = serviceUrl.hostname.split('.');
  if (domains.pop() !== 'co' && domains.pop() !== 'introcept') {
    return res.send('Invalid service');
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
      state: encodeServiceState(req)
    }));
  }
]);

app.get(config.google.callback, [
  function (req, res, next) {
    try {
      req.query.service = decodeServiceState(req);
    } catch (e) {
      return res.send('State absent');
    }
    next();
  },
  validateService,
  function (req, res) {
    // just a simple check
    // won't happen in real scenario
    if (!req.query.code) {
      return res.send('Authorization code is absent');
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
        const email = response.emails[0].value;

        if (response.domain !== 'introcept.co') {
          return res.send('You must have an email address from introcept.co');
        }

        return denodeify(jwt.sign)({
          email: email
        }, config.jwt.key, {algorithm: 'RS256', expiresIn: config.jwt.expiresIn});

      }).then(function(token) {
        return res.redirect(appendQuery(req.query.service, 'token=' + token));
      }).catch(function(err) {
        res.send('Something wrong happened');
        console.error(err);
      });
  }
]);


app.listen(config.port, config.host, function () {
  console.log('pale-dai listening on port ' + config.port);
});
