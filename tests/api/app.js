const should = require('should');
const request = require('supertest');
const appendQuery = require('append-query');
const _ = require('lodash');
const path = require('path');
const jwtModule = require('jsonwebtoken');
const proxyquire = require('proxyquire').noCallThru();
const paale = require('../../index');

const endRequest = req => new Promise((resolve, reject) => {
  req.end((err, res) => {
   if (err) return reject(err);
   resolve(res);
  });
});

describe('Paale dai server tests', () => {
  describe('Pre Google Redirection', () => {
    let app,
      agent;
    before(() => {
      const handler = require(path.resolve('./handler/google-oauth2'));
      const jwtStorage = require(path.resolve('./storage/jwt'));
      app = paale(
        handler('GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'),
        jwtStorage(),
        {
          serviceValidator: service => !_.startsWith(service, 'http://danger'),
        }
      );
      agent = request.agent(app);
    });

    it('should check if redirecting service is present before initiating authentication', () => {
      const req = agent.get('/')
        .expect(400);
      return endRequest(req);
    });

    it('should validate redirecting service', () => {
      const req = agent.get('/?service=http://danger.google.com')
        .expect(403);
      return endRequest(req);
    });

    it('should redirect to google oauth2', () => {
      const req = agent.get('/?service=http://senani.introcept.co')
        .expect(302);
      return endRequest(req);
    });
  });

  describe('Post Google Redirection', () => {
    let app,
      agent,
      stateEncoder,
      OAuth2,
      people = {};

    const state = 'tgije',
      google = {},
      service = 'http://senani.introcept.co',
      jwt = {},
      callbackPath = '/auth',
      fraudService = 'http://danger.example.com';

    const code = '49v29348',
      token = 'alhasdf',
      tokens = {};

    before(() => {
      stateEncoder = {
        decode(sourceState) {
          if (sourceState === state) return service;

          return fraudService;
        },
      };

      OAuth2 = function () {};
      OAuth2.prototype.getToken = function (sourceCode, callback) {
        sourceCode.should.be.exactly(code);
        callback(null, tokens);
      };
      OAuth2.prototype.setCredentials = function (sourceTokens) {
        sourceTokens.should.be.exactly(tokens);
      };

      google.auth = { OAuth2 };

      google.plus = function () {
        return {
          people,
        };
      };

      const handler = proxyquire(path.resolve('./handler/google-oauth2'), {
        googleapis: google,
        './state-encoder': stateEncoder,
      });
      const jwtStorage = proxyquire(path.resolve('./storage/jwt'), {
        jsonwebtoken: jwt,
      });
      app = paale(
        handler('GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'),
        jwtStorage(),
        {
          callbackPath,
          serviceValidator: service => !_.startsWith(service, 'http://danger'),
        }
      );
      agent = request.agent(app);
    });

    it('should check if state is present', () => {
      const req = agent.get(appendQuery(callbackPath, `code=${code}`))
        .expect(403, 'Invalid service');
      return endRequest(req);
    });

    it('should check if authorization token is present', () => {
      const req = agent.get(appendQuery(callbackPath, `state=${state}`))
        .expect(400, 'Authorization code is absent');
      return endRequest(req);
    });

    it('should check if redirecting service is valid', () => {
      const req = agent.get(appendQuery(callbackPath, 'state=v35345'))
        .expect(403, 'Invalid service');
      return endRequest(req);
    });

    // it('should check if email belongs to introcept.co', function () {
    //   people.get = function (opts, callback) {
    //     return callback(null, {
    //       domain: 'gmail.com'
    //     });
    //   };
    //
    //   var req = agent.get(appendQuery(callbackPath, 'code=' + code + '&state=' + state))
    //     .expect(403, 'You must have an email address from introcept.co');
    //   return endRequest(req);
    // });

    it('should redirect to original requesting service', () => {
      const response = {
        domain: 'introcept.co',
        id: '98oiv83434',
        displayName: 'Foo Bar',
        name: { familyName: 'Bar', givenName: 'Foo' },
        emails: [{ value: 'foo.bar@introcept.co' }],
        image: { url: 'http://o23o2i4.com' },
      };

      people.get = function (opts, callback) {
        return callback(null, response);
      };

      jwt.sign = function (data, key, opts, callback) {
        data.id.should.be.exactly(response.id);
        data.displayName.should.be.exactly(response.displayName);
        data.emails[0].value.should.be.exactly('foo.bar@introcept.co');
        callback(null, token);
      };

      const req = agent.get(appendQuery(callbackPath, `code=${code}&state=${state}`))
        .expect(302);
      return endRequest(req);
    });
  });

  describe('Profile API tests', () => {
    let app,
      agent,
      jwt = { JsonWebTokenError: jwtModule.JsonWebTokenError, TokenExpiredError: jwtModule.TokenExpiredError };
    const token = 'o35234-o2345';
    before(() => {
      const handler = require(path.resolve('./handler/google-oauth2'));
      const jwtStorage = proxyquire(path.resolve('./storage/jwt'), {
        jsonwebtoken: jwt,
      });
      app = paale(
        handler('GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'),
        jwtStorage(),
        {
          identityPath: '/me',
        }
      );

      agent = request.agent(app);
    });

    it('should return unauthenticated when Authorization header does not exists', () => {
      const req = agent.get('/me')
        .expect(401);

      return endRequest(req);
    });

    it('should return 400 for incorrect Authorization header format', () => {
      const req = agent.get('/me')
        .set('Authorization', 'Bearer afdasdf asdfsdf')
        .expect(400);

      return endRequest(req);
    });

    it('should return decoded data for correct token', () => {
      const data = { displayName: 'dfsdfk', email: 'oweirwoeri@adfaf.com' };
      jwt.verify = function (sourceToken, key, opts, callback) {
        sourceToken.should.be.exactly(token);
        callback(null, data);
      };

      const req = agent.get('/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      return endRequest(req)
        .then((response) => {
          response.body.email.should.be.exactly(data.email);
          response.body.displayName.should.be.exactly(data.displayName);
        });
    });

    it('should return expired token response for expired token', () => {
      jwt.verify = function (sourceToken, key, opts, callback) {
        sourceToken.should.be.exactly(token);
        callback(new jwt.TokenExpiredError());
      };

      const req = agent.get('/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(401);

      return endRequest(req)
        .then((response) => {
          response.body.code.should.be.exactly('expiredToken');
        });
    });


    it('should return invalid token response for invalid token', () => {
      jwt.verify = function (sourceToken, key, opts, callback) {
        sourceToken.should.be.exactly(token);
        callback(new jwt.JsonWebTokenError());
      };

      const req = agent.get('/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(401);

      return endRequest(req)
        .then((response) => {
          response.body.code.should.be.exactly('invalidToken');
        });
    });

    it('should return 500 incontext of unknown error', () => {
      jwt.verify = function (sourceToken, key, opts, callback) {
        sourceToken.should.be.exactly(token);
        callback(new Error('Crap error'));
      };

      const req = agent.get('/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(500);

      return endRequest(req).then((response) => {
        response.status.should.be.exactly(500);
      });
    });
  });
});
