'use strict';

const should = require('should'),
  request = require('supertest'),
  denodify = require('denodeify'),
  appendQuery = require('append-query'),
  path = require('path'),
  config = require(path.resolve('./dist/config')).default,
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
      people.get = function (opts, callback) {
        return callback(null, {
          domain: 'introcept.co',
          emails: [{value: 'ujjwal.ojha@introcept.co'}]
        });
      };

      jwt.sign = function(data, key, opts, callback) {
        callback(null, token);
      };

      var req = agent.get(appendQuery(config.google.callback, 'code=' + code + '&state=' + state))
        .expect(302);
      return endRequest(req);
    });
  });
});
