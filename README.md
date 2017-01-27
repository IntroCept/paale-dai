paale-dai
=======================
paale-dai is an express based middleware for creating SSO based authentication microservice.

## Example usage with google oauth2 authentication and JWT
```js
const paale = require('paale');
const Handler = require('paale/handler/google-oauth2');
const JwtStorage = require('paale/storage/jwt');


const server = paale(
  new Handler('GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'),
  new JwtStorage(),
);

server.listen();

// using paale-dai as a middleware
// or express().use('/paale', server); 
```