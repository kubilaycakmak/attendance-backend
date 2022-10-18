import express, { response } from 'express';
import User from '../models/user.js';
import extractJwtFromHeader from '../utils/extractJwtFromHeader.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import decodeJWT from '../middleware/check_auth.js';
import verifyGoogleMiddleware from '../middleware/verify_google_user.js';
import { sendEmail } from '../utils/sendEmail.js';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

router.post('/signup', (req, res, next) => {
  bcrypt.hash(req.body.password, 10).then((hash) => {
    User.findOne({ email: req.body.email })
      .then((user1) => {
        if (user1) {
          return res.status(401).json({
            message: 'User Already Exist!',
          });
        }
        user1 = new User({ ...req.body, password: hash });
        user1.save().then((result) => {
          if (!result) {
            return res.status(500).json({
              message: 'Error when creating user',
            });
          }
          res.status(201).json({
            message: 'User created!',
            result: result,
          });
        });
      })
      .catch((err) => {
        res.status(500).json({
          error: err,
        });
      });
  });
});

router.post('/login', (req, res, next) => {
  let fetchedUser;
  User.findOne({ email: req.body.email })
    .then((user) => {
      if (!user) {
        return res.status(401).json({
          message: 'Auth failed no such user',
        });
      }
      fetchedUser = user;
      console.log(req.body.password);
      console.log(user.password);
      return bcrypt.compare(req.body.password, user.password);
    })
    .then((result) => {
      if (!result) {
        return res.status(401).json({
          message: 'Auth failed incorrect password',
        });
      }
      const token = jwt.sign(
        { email: fetchedUser.email, userId: fetchedUser._id },
        process.env.JWT_SECRET,
        { expiresIn: process.env.AUTH_EXPIRESIN }
      );
      res.status(200).json({
        token: token,
        expiresIn: process.env.AUTH_EXPIRESIN,
        userId: fetchedUser._id,
        username: fetchedUser.username,
        email: fetchedUser.email,
        type: fetchedUser.type,
      });
    })
    .catch((e) => {
      console.log(e);
    });
});

/**
 * Check email address and send a resetting link if email exists
 */
router.post('/forgot-password', async (req, res, next) => {
  try {
    const email = req.body.email;
    if (!email) {
      return res.status(400).json({
        message: 'email is not provided. Please enter one.',
      });
    }
    User.findOne({ email: email }).then((user) => {
      if (!user) {
        return res.status(400).json({
          message: 'email for this user not exist',
        });
      }
      console.log(user.id);
      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
        expiresIn: process.env.AUTH_EXPIRESIN,
      });

      const link = `${process.env.BASE_URL}/api/auth/forgot-password/${token}`;

      sendEmail(email, 'Password reset', link).then(() => {
        return res.status(200).json({
          message: 'email successfully sent',
        });
      });
      // return res.status(200).json({
      //   message: "success"
      // })
    });
  } catch (err) {
    console.log(err);
  }
});

router.get('/forgot-password/:token', async (req, res, next) => {
  try {
    const { token } = req.params;
    if (token) {
      jwt.verify(token, process.env.JWT_SECRET, (err, decodedToken) => {
        if (err) {
          return res
            .status(401)
            .json({ message: 'the link is not valid. please try again' });
        }
        const { userId } = decodedToken;
        User.findById({ _id: userId }, (err, user) => {
          if (user) {
            console.log('redirect to frontend');
            res.redirect(
              `${process.env.FRONT_END_URL}/new-password/${userId}?token=${token}`
            );
          } else {
            return res
              .status(404)
              .json({ message: 'there is no such an email' });
          }
        });
      });
    }
  } catch (err) {
    return res
      .status(400)
      .json({ message: 'Invalid credentials, please fill all inputs' });
  }
});

router.post('/new-password', async (req, res, next) => {
  try {
    const { token, password } = req.body;
    if (!token) {
      return res.status(400).json({
        message: 'token not provided.',
      });
    }
    // verify token
    jwt.verify(token, process.env.JWT_SECRET, async (jwtErr, decodedToken) => {
      if (jwtErr) {
        return res.status(400).json({
          message: 'invalid token provided.',
        });
      }
      const { userId } = decodedToken;
      const user = await User.findById(userId);
      if (!user) {
        return res.status(400).json({
          message: "user doesn't exist.",
        });
      }
      const newPassword = await bcrypt.hash(password, 10);
      user.password = newPassword;
      await user.save();
      console.log('user saved..');

      return res.status(200).json({
        message: 'success',
      });
    });
  } catch (error) {
    return res.status(400).json({
      message: 'something went wrong',
    });
  }
});

router.post('/google-signup', verifyGoogleMiddleware, async (req, res) => {
  const creatingUser = req.body;
  const { email } = creatingUser;

  try {
    if (!email) {
      return res.status(400).json({
        message: 'please fill the required field',
      });
    }
    const existingUser = await User.findOne({ email: email });

    if (existingUser) {
      return res.status(400).json({
        message: 'User Already Exist!',
      });
    }

    const user = await User.create({
      ...creatingUser,
    });
    if (!user) {
      return res.status(500).json({
        message: 'Error when creating user',
      });
    }
    const token = jwt.sign(
      { email: user.email, userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.AUTH_EXPIRESIN }
    );
    res.status(201).json({
      token: token,
      expiresIn: process.env.AUTH_EXPIRESIN,
      message: 'User created!',
      result: user,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err,
    });
  }
});

router.post('/google-login', verifyGoogleMiddleware, async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        message: 'Auth failed no such user',
      });
    }
    const token = jwt.sign(
      { email: user.email, userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.AUTH_EXPIRESIN }
    );
    res.status(200).json({
      token: token,
      expiresIn: process.env.AUTH_EXPIRESIN,
      user,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err,
    });
  }
});

router.post('/set-password', decodeJWT, async (req, res) => {
  // check token
  if (!req.headers.authorization) {
    return res.status(401).json({
      message: 'token not provided',
    });
  }
  const { userId } = req.userData;
  const { newPassword } = req.body;
  if (!newPassword) {
    return res.status(400).json({
      message: 'new password is not provided. please enter one',
    });
  }
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(400).json({
        message: 'No such user',
      });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.status(201).json({
      message: 'Password is successfuly created',
      result: user,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err,
    });
  }
});

export default router;
