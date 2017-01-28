const base64url = require('base64-url');

module.exports = {
  encode(service) {
    return base64url.encode(JSON.stringify({ service }));
  },

  decode(state) {
    return JSON.parse(base64url.decode(state)).service;
  },
};
