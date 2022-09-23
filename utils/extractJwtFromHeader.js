const extractJwtFromHeader = (authorization) => {
  return authorization.split('Bearer ')[1];
};

export default extractJwtFromHeader;
