const express = require('express');
const appendQuery = require('append-query');

module.exports = (
  handler,
  tokenStorage,
  {
    identityPath = '/user',
    landingPath = '/',
    callbackPath = '/authentication',
    callbackRouteMethod = 'get',
    serviceValidator = () => true,
    useCookie = false,
    cookieOptions = {},
    app = express(),
    tokenEncrypter = token => Promise.resolve(token),
  } = {}
) => {
  app.get(landingPath, [
    (req, res, next) => {
      const service = handler.parseService(req);
      if (!service) {
        return res.status(400).send('Service not present');
      }
      if (!serviceValidator(service, req)) {
        return res.status(403).send('Invalid service');
      }

      if (useCookie) {
        const token = req.cookies.get('paale_token', cookieOptions);
        if (token) {
          return tokenEncrypter(token, service, req)
            .then(encryptedToken => res.redirect(appendQuery(service, `token=${encryptedToken}`)));
        }
      }

      next();
    },
    handler.landing(callbackPath),
  ]);

  app.route(callbackPath)[callbackRouteMethod]([
    (req, res, next) => {
      const service = handler.parseService(req);
      if (!service || !serviceValidator(service, req)) {
        return res.status(403).send('Invalid service');
      }

      req.paale_service = service;
      next();
    },
    handler.authentication(callbackPath),
    tokenStorage.store,
    (req, res) => {
      if (useCookie) {
        res.cookies.set('paale_token', req.paale_token, cookieOptions);
      }
      tokenEncrypter(req.paale_token, req.paale_service, req)
        .then(encryptedToken => res.redirect(appendQuery(req.paale_service, `token=${encryptedToken}`)));
    },
  ]);

  app.get(identityPath, [
    (req, res, next) => {
      if (useCookie) {
        req.paale_token = req.cookies.get('paale_token', cookieOptions);
        if (req.paale_token) {
          return next();
        }
      }

      let parts = req.get('Authorization');
      if (!parts) {
        return res.status(401).send({ message: 'Unauthenticated' });
      }

      parts = parts.split(' ');

      if (parts.length !== 2) {
        return res.status(400).send({ message: 'Incorrect Authorization header format' });
      }

      req.paale_token = parts[1];

      next();
    },
    tokenStorage.parse,
    (req, res) => res.status(200).send(req.paale_user),
  ]);

  return app;
};
