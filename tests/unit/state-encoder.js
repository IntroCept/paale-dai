const should = require('should');
const path = require('path');
const proxyquire = require('proxyquire').noCallThru();

describe('State encoder tests', () => {
  const service = 'http://senani.introcept.co';
  const state = '23po23u394';

  it('should encode', () => {
    const stateEncoder = proxyquire(path.resolve('./handler/state-encoder'), { 'base64-url': { encode(jsonString) {
      jsonString.should.be.exactly(JSON.stringify({ service }));
      return state;
    } } });

    stateEncoder.encode(service).should.be.exactly(state);
  });

  it('should decode', () => {
    const stateEncoder = proxyquire(path.resolve('./handler/state-encoder'), { 'base64-url': { decode(sourceState) {
      sourceState.should.be.exactly(state);
      return JSON.stringify({ service });
    } } });

    stateEncoder.decode(state).should.be.exactly(service);
  });
});
