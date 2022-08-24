import jwt from "jsonwebtoken";

const decodeJWT = (req, res, next) => {
    try {
      // const token = req.headers.authorization.split(" ")[1];
      const token = req.headers.authorization;
      const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
      req.userData = { email: decodedToken.email, userId: decodedToken.userId };
      next();

    } catch (error) {
      console.error(error)
      res.status(401).json({ message: "Auth failed!" });
    }
};
  

export default decodeJWT;