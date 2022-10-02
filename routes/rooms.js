import express from 'express';
import jwt from 'jsonwebtoken';
import moment from 'moment';
import fs from 'fs';
import Room from '../models/room.js';
import Reservation from '../models/reservation.js';
import decodeJWT from '../middleware/check_auth.js';
import upload from '../middleware/multer.js';
import cloudinary from '../config/cloudStorage.js';
import { validateReservation } from '../helpers/roomHelpers.js';

const router = express.Router();

/**
 * get all reservations
 */
router.get('/reservations', decodeJWT, async (req, res) => {
  try {
    const reservations = await Reservation.find();
    res.status(200).send(reservations);
  } catch (err) {
    console.error('error', err);
  }
});

/**
 * post new reservation
 */
router.post('/reservations', decodeJWT, async (req, res) => {
  const { user_id } = req.userData;
  const {
    room_id,
    type,
    start_date,
    end_date,
    start_time,
    end_time,
    duration,
  } = req.body;
  const { error, statusCode } = await validateReservation({
    room_id,
    type,
    start_date,
    end_date,
    start_time,
    end_time,
    duration,
  });
  if (error) {
    console.log('error', error);
    return res.status(statusCode).send(error);
  }

  try {
    const reservation = await Reservation.create({
      user_id,
      room_id,
      status: 'Pending',
      type,
      start_date,
      end_date,
      start_time,
      end_time,
      duration,
    });
    res.status(200).send(reservation);
  } catch (err) {
    console.error('error', err);
  }
});

/**
 * get all reservations of specific user
 */
router.get('/:room_id/reservations', decodeJWT, async (req, res) => {
  const { room_id } = req.params;

  try {
    const reservations = await Reservation.find({ room_id });
    res.status(200).send(reservations);
  } catch (err) {
    console.error('error', err);
  }
});

export default router;
