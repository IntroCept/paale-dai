import jwt from 'jsonwebtoken';

export default function (
  {
    key = 'paale-key',
    pubKey = 'paale-key',
    algorithm = 'RS256',
    expiresIn = 3600,
  } = {}
) {
  return {
    store(req, res, next) {
      jwt.sign(
        req.paale_user,
        key,
        { algorithm, expiresIn },
        (err, token) => {
          if (err) {
            return next(err);
          }
          req.paale_token = token;
          next();
        }
      );
    },

    parse(req, res, next) {
      jwt.verify(
        req.paale_token,
        pubKey,
        { algorithm },
        (err, token) => {
          if (err instanceof jwt.TokenExpiredError) {
            return res.status(401).send({ message: 'Token expired', code: 'expiredToken' });
          }

          if (err instanceof jwt.JsonWebTokenError) {
            return res.status(401).send({ message: 'Invalid token', code: 'invalidToken' });
          }


          if (err) {
            return next(err);
          }

          req.paale_user = token;
          next();
        }
      );
    }
  };
};
