'use strict';

const should = require('should'),
  path = require('path'),
  proxyquire =  require('proxyquire').noCallThru();

describe('State encoder tests', function () {
  const service = 'http://senani.introcept.co';
  const state = '23po23u394';

  it('should encode', function () {
    const stateEncoder = proxyquire(path.resolve('./dist/state-encoder'), {'base64-url': {encode: function (jsonString) {
      jsonString.should.be.exactly(JSON.stringify({service: service}));
      return state;
    }}});

    stateEncoder.encode(service).should.be.exactly(state);
  });

  it('should decode', function () {
    const stateEncoder = proxyquire(path.resolve('./dist/state-encoder'), {'base64-url': {decode: function (sourceState) {
      sourceState.should.be.exactly(state);
      return JSON.stringify({service: service});
    }}});

    stateEncoder.decode(state).should.be.exactly(service);
  });
});
