const base64url = require('base64-url');

exports.encode = function(service) {
  return base64url.encode(JSON.stringify({ service }));
};

exports.decode = function(state) {
  return JSON.parse(base64url.decode(state)).service;
};
