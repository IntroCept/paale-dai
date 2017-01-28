paale-dai
=======================
[![Build Status](https://travis-ci.org/IntroCept/paale-dai.svg?branch=master)](https://travis-ci.org/IntroCept/paale-dai)

paale-dai is an express based middleware for creating SSO based authentication microservice.

## Example usage with google oauth2 authentication and JWT
```js
const paale = require('paale-dai');
const handler = require('paale-dai/handler/google-oauth2');
const jwtStorage = require('paale-dai/storage/jwt');


const server = paale(
  handler('GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'),
  jwtStorage(),
);

server.listen();

// using paale-dai as a middleware
// or express().use('/paale', server); 
```