import express from 'express';
import appendQuery from 'append-query';

export default function (
  handler,
  tokenStorage,
  {
    identityPath = '/user',
    landingPath = '/',
    callbackPath = '/authentication',
    callbackRouteMethod = 'get',
    serviceValidator = () => true,
  } = {}
) {
  const app = express();

  app.get(landingPath, [
    (req, res, next) => {
      const service = handler.parseService(req);
      if (!service) {
        return res.status(400).send('Service not present');
      }
      if (!serviceValidator(service)) {
        return res.status(403).send('Invalid service');
      }
      next();
    },
    handler.landing(callbackPath),
  ]);

  app.route(callbackPath)[callbackRouteMethod]([
    (req, res, next) => {
      const service = handler.parseService(req);
      if (!service || !serviceValidator(service)) {
        return res.status(403).send('Invalid service');
      }

      req.paale_service = service;
      next();
    },
    handler.authentication,
    tokenStorage.store,
    (req, res) => res.redirect(appendQuery(req.paale_service, `token=${req.paale_token}`))
  ]);

  app.get(identityPath, [
    (req, res, next) => {
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
    (req, res) => res.status(200).send(req.paale_user)
  ]);

  return app;
}
