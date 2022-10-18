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
    const reservations = await Reservation.find({
      status: { $ne: 'Canceled' },
    });
    res.status(200).json(reservations);
  } catch (err) {
    res.status(500).json({ message: 'unexpected error occured' });
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
    return res.status(statusCode).json({ message: error });
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
      duration: type === 'weekly' ? duration : null,
    });
    res.status(201).json(reservation);
  } catch (err) {
    res.status(500).json({ message: 'unexpected error occured' });
  }
});

/**
 * set appointment status to "Active"
 */
router.put(
  '/reservations/:reservationId/confirm',
  decodeJWT,
  async (req, res) => {
    const { reservationId } = req.params;
    try {
      const reservation = await Reservation.findById(reservationId);
      if (!reservation) {
        return res
          .status(404)
          .json({ message: 'reservation with provided ID not found' });
      }
      reservation.status = 'Active';
      await reservation.save();
      res
        .status(200)
        .json({ message: 'reservation is now confirmed', reservation });
    } catch (e) {
      res.status(500).json({ message: 'unexpected error occured' });
    }
  }
);

/**
 * set appointment status to "Canceled"
 */
router.put(
  '/reservations/:reservationId/cancel',
  decodeJWT,
  async (req, res) => {
    const { reservationId } = req.params;
    try {
      const reservation = await Reservation.findById(reservationId);
      if (!reservation) {
        return reservation
          .status(404)
          .json({ message: 'reservation with provided ID not found' });
      }
      reservation.status = 'Canceled';
      await reservation.save();
      res.status(200).json({ message: 'reservation is now canceled' });
    } catch (e) {
      res.status(500).json({ message: 'unexpected error occured' });
    }
  }
);

/**
 * get all reservations of specific user
 */
router.get('/:room_id/reservations', decodeJWT, async (req, res) => {
  const { room_id } = req.params;

  try {
    const reservations = await Reservation.find({
      room_id,
      status: { $ne: 'Canceled' },
    });
    res.status(200).json(reservations);
  } catch (err) {
    res.status(500).json({ message: 'unexpected error occured' });
  }
});

export default router;
