const extractJwtFromHeader = (authorization) => {
  if (authorization.indexOf('Bearer ') === -1) return authorization;
  return authorization.split('Bearer ')[1];
};

export default extractJwtFromHeader;
