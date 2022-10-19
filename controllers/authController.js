import User from '../models/user.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { sendEmail } from '../utils/sendEmail.js';
import dotenv from 'dotenv';

dotenv.config();

export const signup = async (req, res) => {
  const { email, password, username } = req.body;
  if (!password?.trim() || !email || !username) {
    return res.status(401).json({
      message: 'please provide required fields.',
    });
  }
  try {
    const hash = await bcrypt.hash(password, 10);
    console.log('hash', hash);
    const user = await User.findOne({ email });
    if (user) {
      return res.status(401).json({
        message: 'User Already Exist!',
      });
    }
    const newUser = new User({ ...req.body, password: hash });
    const result = newUser.save();
    if (!result) {
      return res.status(500).json({
        message: 'Error when creating user',
      });
    }
    res.status(201).json({
      message: 'User created!',
      result: result,
    });
  } catch (err) {
    console.log('err:', err);
    return res.status(500).json({
      message: 'unexpected error occured. please try again',
    });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  let fetchedUser;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        message: 'Auth failed no such user',
      });
    }
    fetchedUser = user;
    // check password
    const result = await bcrypt.compare(password, user.password);
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
    return res.status(200).json({
      token: token,
      expiresIn: process.env.AUTH_EXPIRESIN,
      userId: fetchedUser._id,
      username: fetchedUser.username,
      email: fetchedUser.email,
      type: fetchedUser.type,
    });
  } catch (err) {
    console.log('err:', err);
    return res.status(500).json({
      message: 'unexpected error occured. please try again',
    });
  }
};

/**
 * Check email address and send a resetting link if email exists
 */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        message: 'email is not provided. Please enter one.',
      });
    }
    const user = await User.findOne({ email: email });
    if (!user) {
      return res.status(400).json({
        message: 'email for this user not exist',
      });
    }
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: process.env.AUTH_EXPIRESIN,
    });

    const link = `${process.env.BASE_URL}/api/auth/forgot-password/${token}`;
    await sendEmail(email, 'Password reset', link);

    return res.status(200).json({
      message: 'email with a link was sent to rest password',
    });
  } catch (err) {
    console.log('err:', err);
    return res.status(500).json({
      message: 'unexpected error occured. please try again',
    });
  }
};

export const checkEmailTokenAndRedirect = async (req, res) => {
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
              .json({ message: 'user not found with provided token' });
          }
        });
      });
    }
  } catch (err) {
    return res
      .status(400)
      .json({ message: 'Invalid credentials, please fill all inputs' });
  }
};

export const updatePassword = async (req, res) => {
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
  } catch (err) {
    console.log('err:', err);
    return res.status(500).json({
      message: 'unexpected error occured. please try again',
    });
  }
};

export const signupWithGoogle = async (req, res) => {
  const { email } = req.body;

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
      ...req.body,
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
    console.log('err:', err);
    return res.status(500).json({
      message: 'unexpected error occured. please try again',
    });
  }
};

export const loginWithGoogle = async (req, res) => {
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
    console.log('err:', err);
    return res.status(500).json({
      message: 'unexpected error occured. please try again',
    });
  }
};

/**
 * set password after signup with Google
 */
export const setFirstPassword = async (req, res) => {
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
    console.log('err:', err);
    return res.status(500).json({
      message: 'unexpected error occured. please try again',
    });
  }
};
