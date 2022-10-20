import express from 'express';
import dotenv from 'dotenv';
import decodeJWT from '../middleware/checkAuth.js';
import verifyGoogleMiddleware from '../middleware/verifyGoogleUser.js';
import {
  signup,
  login,
  forgotPassword,
  checkEmailTokenAndRedirect,
  updatePassword,
  signupWithGoogle,
  loginWithGoogle,
  setFirstPassword,
} from '../controllers/authController.js';

dotenv.config();

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.get('/forgot-password/:token', checkEmailTokenAndRedirect);
router.post('/new-password', updatePassword);
router.post('/google-signup', verifyGoogleMiddleware, signupWithGoogle);
router.post('/google-login', verifyGoogleMiddleware, loginWithGoogle);
router.post('/set-password', decodeJWT, setFirstPassword);

export default router;
