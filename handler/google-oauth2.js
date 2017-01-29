const google = require('googleapis');
const denodeify = require('denodeify');
const stateEncoder = require('./state-encoder');

const OAuth2 = google.auth.OAuth2;
const plus = google.plus('v1');

const parseService = (req) => {
  if (!req.query.state) {
    return req.query.service;
  }

  return stateEncoder.decode(req.query.state);
};

const redirectUrl = (req, callbackPath) =>
    `${req.protocol}://${req.get('Host')}${req.baseUrl}${callbackPath}`
  ;

module.exports = (
  clientId,
  clientSecret,
  scope = ['https://www.googleapis.com/auth/plus.me']
) =>
  ({
    landing(callbackPath) {
      return (req, res) => {
        const oauth2Client = new OAuth2(
          clientId,
          clientSecret,
          redirectUrl(req, callbackPath)
        );

        res.redirect(oauth2Client.generateAuthUrl({
          access_type: 'online',
          scope,
          state: stateEncoder.encode(parseService(req)),
        }));
      };
    },
    authentication(callbackPath) {
      return (req, res, next) => {
        // just a simple check
        // won't happen in real scenario
        if (!req.query.code) {
          return res.status(400).send('Authorization code is absent');
        }

        const oauth2Client = new OAuth2(
          clientId,
          clientSecret,
          redirectUrl(req, callbackPath)
        );

        denodeify(oauth2Client.getToken).bind(oauth2Client)(req.query.code)
          .then((tokens) => {
            oauth2Client.setCredentials(tokens);

            return denodeify(plus.people.get)({ userId: 'me', auth: oauth2Client });
          })
          .then((user) => {
            req.paale_user = user;
            next();
          })
          .catch(next);
      };
    },
    parseService,
  })
;
