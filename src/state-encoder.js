'use strict';

import base64url from 'base64-url';

export function encode(service) {
  return base64url.encode(JSON.stringify({service: service}));
}

export function decode(state) {
  return JSON.parse(base64url.decode(state)).service;
}
