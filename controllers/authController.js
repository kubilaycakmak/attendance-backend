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
      message: 'Please provide required fields.',
    });
  }
  try {
    const hash = await bcrypt.hash(password, 10);
    console.log('hash', hash);
    const user = await User.findOne({ email });
    if (user) {
      return res.status(401).json({
        message: 'User with provided email already exists.',
      });
    }
    const newUser = new User({ ...req.body, password: hash });
    const result = await newUser.save();
    if (!result) {
      return res.status(500).json({
        message: 'Error occured while registering.',
      });
    }
    res.status(201).json({
      message: 'User successfully created.',
      result: result,
    });
  } catch (err) {
    console.log('err:', err);
    return res.status(500).json({
      message: 'Unexpected error occured. Please try again.',
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
        message: 'User with provided email does not exist.',
      });
    }
    fetchedUser = user;
    // check password
    const result = await bcrypt.compare(password, user.password);
    if (!result) {
      return res.status(401).json({
        message: 'Wrong password provided. Please try again.',
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
      message: 'Unexpected error occured. Please try again.',
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
        message: 'Email is not provided. Please provide one.',
      });
    }
    const user = await User.findOne({ email: email });
    if (!user) {
      return res.status(400).json({
        message: 'User with provided email does not exist.',
      });
    }
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: process.env.AUTH_EXPIRESIN,
    });

    const link = `${process.env.BASE_URL}/api/auth/forgot-password/${token}`;
    await sendEmail(email, 'Password reset', link);

    return res.status(200).json({
      message: 'Email was sent with a link to rest password.',
    });
  } catch (err) {
    console.log('err:', err);
    return res.status(500).json({
      message: 'Unexpected error occured. Please try again.',
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
            .json({ message: 'The link is not valid. Please try again' });
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
              .json({ message: 'User with provided ID does not exist.' });
          }
        });
      });
    }
  } catch (err) {
    return res
      .status(400)
      .json({ message: 'Invalid credentials, Please fill all inputs' });
  }
};

export const updatePassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token) {
      return res.status(400).json({
        message: 'Token not provided.',
      });
    }
    // verify token
    jwt.verify(token, process.env.JWT_SECRET, async (jwtErr, decodedToken) => {
      if (jwtErr) {
        return res.status(400).json({
          message: 'Invalid token provided.',
        });
      }
      const { userId } = decodedToken;
      const user = await User.findById(userId);
      if (!user) {
        return res.status(400).json({
          message: 'User with the provided ID does not exist.',
        });
      }
      const newPassword = await bcrypt.hash(password, 10);
      user.password = newPassword;
      await user.save();
      console.log('user saved..');

      return res.status(200).json({
        message: 'Password was successfully updated.',
      });
    });
  } catch (err) {
    console.log('err:', err);
    return res.status(500).json({
      message: 'Unexpected error occured. Please try again.',
    });
  }
};

export const signupWithGoogle = async (req, res) => {
  const { email } = req.body;

  try {
    if (!email) {
      return res.status(400).json({
        message: 'Please fill all required fields',
      });
    }
    const existingUser = await User.findOne({ email: email });

    if (existingUser) {
      return res.status(400).json({
        message: 'User with provided email already exists.',
      });
    }

    const user = await User.create({
      ...req.body,
    });
    const token = jwt.sign(
      { email: user.email, userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.AUTH_EXPIRESIN }
    );
    res.status(201).json({
      token: token,
      expiresIn: process.env.AUTH_EXPIRESIN,
      message: 'User successfully created.',
      result: user,
    });
  } catch (err) {
    console.log('err:', err);
    return res.status(500).json({
      message: 'Unexpected error occured. Please try again.',
    });
  }
};

export const loginWithGoogle = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        message: 'User with provided email does not exist.',
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
      message: 'Unexpected error occured. Please try again.',
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
      message: 'Token not provided.',
    });
  }
  const { userId } = req.userData;
  const { newPassword } = req.body;
  if (!newPassword) {
    return res.status(400).json({
      message: 'New password is not provided. Please provide one',
    });
  }
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(400).json({
        message: 'User with provided ID does not exist.',
      });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.status(201).json({
      message: 'Password was successfuly created',
      result: user,
    });
  } catch (err) {
    console.log('err:', err);
    return res.status(500).json({
      message: 'Unexpected error occured. Please try again.',
    });
  }
};
