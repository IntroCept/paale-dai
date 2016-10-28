

import fs from 'fs';

let jwtKey;
if (process.env.JWT_PRIVATE_KEY_FILE) {
  jwtKey = fs.readFileSync(process.env.JWT_PRIVATE_KEY_FILE);
} else {
  jwtKey = process.env.JWT_PRIVATE_KEY ? Buffer.from(process.env.JWT_PRIVATE_KEY) : 'pale-dai';
}

export default {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3000,
  host: process.env.HOST || '0.0.0.0',
  // DOMAIN config should be set to the fully qualified application accessible
  // URL. For example: https://www.myapp.com (including port if required).
  domain: process.env.DOMAIN,
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || 'client id',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'client secret',
    callback: '/google-callback',
  },
  jwt: {
    key: jwtKey,
    expiresIn: process.env.TOKEN_EXPIRY || 3600, // 1 hour by default
  },
};
