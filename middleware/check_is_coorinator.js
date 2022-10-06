import User from '../models/user.js';

/**
 * 
 userData should be recieved by decodeJwt middleware

 */
const checkIsCoordinator = async (req, res, next) => {
  const { userId } = req.userData;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: 'no such user.',
      });
    }
    const isCoordinator = user.role.includes('Coordinator');
    if (!isCoordinator) {
      return res.status(403).json({
        message: 'room con be created only by coordinaror.',
      });
    }
    next();
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

export default checkIsCoordinator;
