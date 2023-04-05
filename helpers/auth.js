const jwt = require('jsonwebtoken');
const { SUPABASE_JWT_KEY } = process.env;

class AuthError extends Error {
  constructor(message, options = { logout: true }) {
    super(message);
    this.logout = options.logout;
  }
}

exports.validateJWT = (token) => {
  try {
    const user = jwt.verify(token, SUPABASE_JWT_KEY);

    user.uid = user.sub;

    return user;
  } catch (e) {
    throw new AuthError('Invalid session');
  }
};

exports.validate = async (request = {}) => {
  const { headers = {} } = request;
  const { authorization } = headers;
  const token = String(authorization ?? '').split(' ')?.[1];
  return this.validateJWT(token);
};
