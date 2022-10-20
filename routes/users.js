import express from 'express';
import decodeJWT from '../middleware/checkAuth.js';
import upload from '../middleware/multer.js';
import {
  getLoggedInUserData,
  updateUserInfo,
  updateUserPhoto,
  cancelAppointment,
  confirmAppointment,
  createNewAppointment,
  getAppointmentsOfUser,
} from '../controllers/userController.js';

const router = express.Router();
// router.use()

router.get('/me', decodeJWT, getLoggedInUserData);
router.put(
  '/information-update',
  decodeJWT,
  upload.single('photo'),
  updateUserInfo
);
router.post(
  '/update-photo',
  decodeJWT,
  upload.single('photo'),
  updateUserPhoto
);
router.get('/:id/appointments', getAppointmentsOfUser);
router.post('/appointments', createNewAppointment);
router.put('/appointments/:appointmentId/confirm', confirmAppointment);
router.put('/appointments/:appointmentId/cancel', cancelAppointment);

export default router;
