import fs from 'fs';

const readKey = (fileConst, keyConst) => {
  if (process.env[fileConst]) {
    return fs.readFileSync(process.env[fileConst]);
  }

  return process.env[keyConst] ? Buffer.from(process.env[keyConst]) : 'pale-dai';
};

// export immutable config object
export default Object.freeze({
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
    algorithm: 'RS256',
    key: readKey('JWT_PRIVATE_KEY_FILE', 'JWT_PRIVATE_KEY'),
    pubKey: readKey('JWT_PUBLIC_KEY_FILE', 'JWT_PUBLIC_KEY'),
    expiresIn: process.env.TOKEN_EXPIRY || 3600, // 1 hour by default
  },
  errorCodes: {
    expiredToken: 1001,
    invalidToken: 1002,
  },
});
