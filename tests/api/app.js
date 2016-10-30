'use strict';

const should = require('should'),
  request = require('supertest'),
  denodify = require('denodeify'),
  appendQuery = require('append-query'),
  _ = require('lodash'),
  path = require('path'),
  config = require(path.resolve('./dist/config')).default,
  jwtModule = require('jsonwebtoken'),
  proxyquire =  require('proxyquire').noCallThru();

const endRequest = function(req) {
  return new Promise(function(resolve, reject) {
    req.end(function(err, res) {
      if (err) return reject(err);
      resolve(res);
    });
  });
};

describe('Paale dai server tests', function () {
  describe('Pre Google Redirection', function () {
    var app, agent;
    before(function () {
      app = require(path.resolve('./dist/app')).default;
      agent = request.agent(app);
    });

    it('should check if redirecting service is present before initiating authentication', function () {
      var req = agent.get('/')
        .expect(400);
      return endRequest(req);
    });

    it('should validate redirecting service', function () {
      var req = agent.get('/?service=http://google.com')
        .expect(403);
      return endRequest(req);
    });

    it('should redirect to google oauth2', function () {
      var req = agent.get('/?service=http://senani.introcept.co')
        .expect(302);
      return endRequest(req);
    });
  });

  describe('Post Google Redirection', function () {
    var app, agent, stateEncoder, OAuth2, people = {};

    const state = 'tgije',
      google = {},
      service = 'http://senani.introcept.co',
      jwt = {},
      fraudService = 'http://danger.example.com';

    const code = '49v29348', token = 'alhasdf', tokens = {};

    before(function () {
      stateEncoder = {
        decode: function (sourceState) {
          if (sourceState === state ) return service;

          return fraudService;
        }
      };

      OAuth2 = function () {};
      OAuth2.prototype.getToken = function (sourceCode, callback) {
        sourceCode.should.be.exactly(code);
        callback(null, tokens);
      };
      OAuth2.prototype.setCredentials = function (sourceTokens) {
        sourceTokens.should.be.exactly(tokens);
      };

      google.auth = {OAuth2: OAuth2};

      google.plus = function () {
        return {
          people: people
        };
      };

      app = proxyquire(path.resolve('./dist/app'), {
        './state-encoder': stateEncoder,
        'googleapis': google,
        'jsonwebtoken': jwt
      }).default;
      agent = request.agent(app);
    });

    it('should check if state is present', function () {
      var req = agent.get(config.google.callback)
        .expect(400, 'State absent');
      return endRequest(req);
    });

    it('should check if authorization token is present', function () {
      var req = agent.get(appendQuery(config.google.callback, 'state=' + state))
        .expect(400, 'Authorization code is absent');
      return endRequest(req);
    });

    it('should check if redirecting service is valid', function () {
      var req = agent.get(appendQuery(config.google.callback, 'state=v35345'))
        .expect(403, 'Invalid service');
      return endRequest(req);
    });

    it('should check if email belongs to introcept.co', function () {
      people.get = function (opts, callback) {
        return callback(null, {
          domain: 'gmail.com'
        });
      };

      var req = agent.get(appendQuery(config.google.callback, 'code=' + code + '&state=' + state))
        .expect(403, 'You must have an email address from introcept.co');
      return endRequest(req);
    });

    it('should redirect to original requesting service', function () {
      var response = {
        domain: 'introcept.co',
        id: '98oiv83434',
        displayName: 'Foo Bar',
        name: {familyName: 'Bar', givenName: 'Foo'},
        emails: [{value: 'foo.bar@introcept.co'}],
        image: {url: 'http://o23o2i4.com'},
      };

      people.get = function (opts, callback) {
        return callback(null, response);
      };

      jwt.sign = function(data, key, opts, callback) {
        data.id.should.be.exactly(response.id);
        data.displayName.should.be.exactly(response.displayName);
        data.email.should.be.exactly('foo.bar@introcept.co');
        callback(null, token);
      };

      var req = agent.get(appendQuery(config.google.callback, 'code=' + code + '&state=' + state))
        .expect(302);
      return endRequest(req);
    });
  });

  describe('Profile API tests', function() {
    let app,
      agent,
      jwt = {JsonWebTokenError: jwtModule.JsonWebTokenError, TokenExpiredError: jwtModule.TokenExpiredError};
    const token = 'o35234-o2345';
    before(function () {
      app = proxyquire(path.resolve('./dist/app'), {
        'jsonwebtoken': jwt
      }).default;
      agent = request.agent(app);
    });

    it('should return unauthenticated when Authorization header does not exists', function() {
      var req = agent.get('/me')
        .expect(401);

      return endRequest(req);
    });

    it('should return 400 for incorrect Authorization header format', function() {
      var req = agent.get('/me')
        .set('Authorization', 'Bearer afdasdf asdfsdf')
        .expect(400);

      return endRequest(req);
    });

    it('should return decoded data for correct token', function () {
      const data = {displayName: 'dfsdfk', email: 'oweirwoeri@adfaf.com'};
      jwt.verify = function(sourceToken, key, opts, callback) {
        sourceToken.should.be.exactly(token);
        callback(null, data);
      };

      var req = agent.get('/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      return endRequest(req)
        .then(function (response) {
          response.body.email.should.be.exactly(data.email);
          response.body.displayName.should.be.exactly(data.displayName);
        });
    });

    it('should return expired token response for expired token', function () {
      jwt.verify = function(sourceToken, key, opts, callback) {
        sourceToken.should.be.exactly(token);
        callback(new jwt.TokenExpiredError);
      };

      var req = agent.get('/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(401);

      return endRequest(req)
        .then(function (response) {
          response.body.code.should.be.exactly(config.errorCodes.expiredToken);
        });
    });


    it('should return invalid token response for invalid token', function () {
      jwt.verify = function(sourceToken, key, opts, callback) {
        sourceToken.should.be.exactly(token);
        callback(new jwt.JsonWebTokenError);
      };

      var req = agent.get('/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(401);

      return endRequest(req)
        .then(function (response) {
          response.body.code.should.be.exactly(config.errorCodes.invalidToken);
        });
    });

    it('should return 500 incontext of unknown error', function () {
      jwt.verify = function(sourceToken, key, opts, callback) {
        sourceToken.should.be.exactly(token);
        callback(new Error('Crap error'));
      };

      var req = agent.get('/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(500);

      return endRequest(req).then(function (response) {
        response.status.should.be.exactly(500);
      });
    });
  });
});
