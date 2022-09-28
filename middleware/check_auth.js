import jwt from 'jsonwebtoken';
import extractJwtFromHeader from '../utils/extractJwtFromHeader.js';

const decodeJWT = (req, res, next) => {
  try {
    const token = req.headers.authorization;
    const decodedToken = jwt.verify(
      extractJwtFromHeader(token),
      process.env.JWT_SECRET
    );
    req.userData = { email: decodedToken.email, userId: decodedToken.userId };
    next();
  } catch (error) {
    console.error(error);
    res.status(401).json({ message: 'Auth failed!' });
  }
};

export default decodeJWT;
