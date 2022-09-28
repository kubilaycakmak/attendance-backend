import express from 'express';
import User from '../models/user.js';
import Appointment from '../models/appointment.js';
import Reservation from '../models/reservation.js';
import decodeJWT from '../middleware/check_auth.js';
import { getSchedules } from '../helpers/userHeplers.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import upload from '../middleware/multer.js';
import cloudinary from '../config/cloudStorage.js';
import fs from 'fs';
import moment from 'moment';

const router = express.Router();
// router.use()

router.get('/me', decodeJWT, async (req, res) => {
  const { userId } = req.userData;
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: 'no such user',
      });
    }

    const appointments = await Appointment.find({
      $or: [{ created_by: userId }, { target_user: userId }],
    });
    const reservations = await Reservation.find({
      $or: [{ created_by: userId }, { target_user: userId }],
    });

    const token = jwt.sign(
      { email: user.email, userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.AUTH_EXPIRESIN }
    );

    res.status(200).json({
      token: token,
      user: user,
      appointments: appointments,
      reservations: reservations,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json(err);
  }
});

router.put(
  '/information-update',
  decodeJWT,
  upload.single('photo'),
  async (req, res) => {
    const { userId } = req.userData;
    const { full_name, password, current_program, social } = req.body;

    try {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          message: 'no such user',
        });
      }

      if (full_name) user.full_name = full_name;
      if (password) user.password = password;
      if (current_program) user.current_program = current_program;
      if (social) {
        const { discord, slack, linkedin } = social;

        if (discord) social.discord = discord;
        if (slack) social.slack = slack;
        if (linkedin) social.linkedin = linkedin;
        user.social = social;
      }

      await user.save();
      return res.status(200).json(user);
    } catch (err) {
      console.error(err);
      res.status(500).json(err);
    }
  }
);

router.post(
  '/update-photo',
  decodeJWT,
  upload.single('photo'),
  async (req, res) => {
    const { userId } = req.userData;
    try {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          message: 'no such user',
        });
      }
      const result = await cloudinary.uploader.upload(req.file.filename, {
        public_id: userId,
        folder: 'attendance/users',
        overwrite: true,
      });
      console.log(result);

      fs.unlink(`${req.file.filename}`, (err) => {
        if (err) throw err;
        console.log('file successfully deleted');
      });
      user.photo = result.url;
      await user.save();

      return res.status(201).json({
        message: 'user photo is updated successfully!!',
        user,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json(err);
    }
  }
);

/**
 * get all appointments of specific user
 */
router.get('/:id/appointments', async (req, res) => {
  const { id } = req.params;
  try {
    const appointments = await getSchedules(id);
    res.status(200).send(appointments);
  } catch (err) {
    console.error('error', err);
  }
});

/**
 * post new appointment
 */
router.post('/appointments', async (req, res) => {
  const { created_by, target_user, datetime } = req.body;
  try {
    const createdUser = await User.findById(created_by);
    const targetUser = await User.findById(target_user);

    if (!createdUser || !targetUser) {
      return res.status(404).json({
        message: 'no such user',
      });
    }

    const schedules = await getSchedules(created_by);
    // check if requested date and time is available
    const dateObj = new Date(datetime);
    const month = dateObj.getMonth() + 1;
    const date = dateObj.getDate();
    const formattedTime = moment(datetime).format('h:mm A');
    let targetScheduleOption = schedules
      .find((monthBlock) => monthBlock[0].month === month)
      ?.find((dateBlock) => dateBlock.date === date)
      ?.options.find((option) => {
        return option.time === formattedTime;
      });

    console.log('target', targetScheduleOption);
    if (!targetScheduleOption || !targetScheduleOption.isAvailable) {
      return res.status(400).json({
        message: 'requested date or time not available',
      });
    }
    const appointment = await Appointment.create({
      created_by,
      target_user,
      datetime,
      status: 'Pending',
    });

    res.status(201).json({
      message: 'appointment is now created with status pending',
      appointment,
    });
  } catch (err) {
    console.error('errror', err);
    res.status(500).json(err);
  }
});

/**
 * set appointment status to "Active"
 */
router.put('/appointments/:id/confirm', async (req, res) => {
  const { id } = req.params;
  try {
    const appointment = await Appointment.findById(id);
    if (!appointment)
      return res.status(404).json({ message: 'appointment not found' });
    appointment.status = 'Active';
    await appointment.save();
    return res
      .status(200)
      .json({ message: 'appointment is now confirmed', appointment });
  } catch (err) {
    console.error(err);
    res.status(500).json(err);
  }
});

/**
 * set appointment status to "Canceled"
 */
router.put('/appointments/:id/cancel', async (req, res) => {
  const { id } = req.params;
  try {
    const appointment = await Appointment.findById(id);
    if (!appointment)
      return res.status(404).json({ message: 'appointment not found' });
    appointment.status = 'Canceled';
    await appointment.save();
    return res
      .status(200)
      .json({ message: 'appointment is now canceled', appointment });
  } catch (err) {
    console.error(err);
    res.status(500).json(err);
  }
});

export default router;
