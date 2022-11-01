import Room from '../models/room.js';
import Reservation from '../models/reservation.js';
import fileUploadHelper from '../helpers/flileUploadHelper.js';
import { validateReservation } from '../helpers/roomHelpers.js';
import getNextAvailableTime from '../helpers/getNextAvailableTime.js';
import moment from 'moment';

export const getAllRoomsInfo = async (req, res) => {
  try {
    const rooms = await Room.find();
    return res.status(200).json(rooms);
  } catch (err) {
    console.log('err:', err);
    return res.status(500).json({
      message: 'Unexpected error occured. Please try again.',
    });
  }
};

export const getRoomInfo = async (req, res, next) => {
  const { id } = req.params;

  if (id == 'reservations') {
    return next();
  }

  try {
    const room = await Room.findById(id);
    if (!room) {
      return res.status(404).json({
        message: 'Room with provided ID does not exist.',
      });
    }
    const nextAvailableTime = await getNextAvailableTime(id);
    return res.status(200).json({
      room: {
        ...room._doc,
        nextAvailableTime,
      },
    });
  } catch (err) {
    console.log('err:', err);
    return res.status(500).json({
      message: 'Unexpected error occured. Please try again.',
    });
  }
};

export const createNewRoom = async (req, res) => {
  try {
    const room = await Room.create({
      ...req.body,
    });
    return res
      .status(201)
      .json({ room, message: 'Room was successfully created.' });
  } catch (err) {
    console.log('err:', err);
    return res.status(500).json({
      message: 'Unexpected error occured. Please try again.',
    });
  }
};

export const updateRoomInfo = async (req, res) => {
  const { id } = req.params;
  const { name, type, floor, description, picture_url, total_seats } = req.body;
  try {
    const room = await Room.findById(id);

    if (!room) {
      return res.status(404).json({
        message: 'Room with provided ID does not exist.',
      });
    }

    if (name) room.name = name;
    if (type) room.type = type;
    if (floor) room.floor = floor;
    if (description) room.description = description;
    if (picture_url) room.picture_url = picture_url;
    if (total_seats) room.total_seats = total_seats;

    await room.save();

    return res.status(200).json({
      room,
      message: 'Room was successfully updated.',
    });
  } catch (err) {
    console.log('err:', err);
    return res.status(500).json({
      message: 'Unexpected error occured. Please try again.',
    });
  }
};

export const updateRoomPhoto = async (req, res) => {
  const { id } = req.params;
  try {
    const room = await Room.findById(id);
    if (!room) {
      return res.status(200).json({
        message: 'Room with provided ID does not exist.',
      });
    }
    const result = await fileUploadHelper(req.file.filename, id, 'rooms');

    room.picture_url = result.url;
    await room.save();

    return res.status(200).json({
      room,
      message: 'Room photo was successfully updated.',
    });
  } catch (err) {
    console.log('err:', err);
    return res.status(500).json({
      message: 'Unexpected error occured. Please try again.',
    });
  }
};

export const deleteRoom = async (req, res) => {
  const { id } = req.params;
  try {
    const room = await Room.findById(id);
    if (!room) {
      return res.status(404).json({
        message: 'Room with provided ID does not exist.',
      });
    }

    await Room.findByIdAndDelete(id);

    res.status(200).json({
      message: 'Room was successfully deleted.',
    });
  } catch (err) {
    console.log('err:', err);
    return res.status(500).json({
      message: 'Unexpected error occured. Please try again.',
    });
  }
};

/**
 * get all reservations
 */
export const getAllReservations = async (req, res) => {
  try {
    const reservations = await Reservation.find({
      status: { $ne: 'Canceled' },
    });
    res.status(200).json(reservations);
  } catch (err) {
    console.log('err:', err);
    return res.status(500).json({
      message: 'Unexpected error occured. Please try again.',
    });
  }
};

/**
 * get all reservations of specific room
 */
export const getAllReservationsOfRoom = async (req, res) => {
  const { room_id } = req.params;

  try {
    const reservations = await Reservation.find({
      room_id,
      status: { $ne: 'Canceled' },
    });
    res.status(200).json(reservations);
  } catch (err) {
    console.log('err:', err);
    return res.status(500).json({
      message: 'Unexpected error occured. Please try again.',
    });
  }
};

/**
 * post new reservation
 */
export const createNewReservation = async (req, res) => {
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
    const createActualEndDate = (endDate, duration) => {
      return moment(endDate)
        .add(duration - 1, 'weeks')
        .format('YYYY-MM-DD');
    };

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
      actual_end_date:
        type === 'weekly' ? createActualEndDate(end_date, duration) : end_date,
    });
    res.status(201).json(reservation);
  } catch (err) {
    console.log('err:', err);
    return res.status(500).json({
      message: 'Unexpected error occured. Please try again.',
    });
  }
};

export const confirmReservation = async (req, res) => {
  const { reservationId } = req.params;
  try {
    const reservation = await Reservation.findById(reservationId);
    if (!reservation) {
      return res
        .status(404)
        .json({ message: 'Reservation with provided ID not found' });
    }
    reservation.status = 'Active';
    await reservation.save();
    res
      .status(200)
      .json({ message: 'Reservation is now confirmed', reservation });
  } catch (err) {
    console.log('err:', err);
    return res.status(500).json({
      message: 'Unexpected error occured. Please try again.',
    });
  }
};

export const cancelReservation = async (req, res) => {
  const { reservationId } = req.params;
  try {
    const reservation = await Reservation.findById(reservationId);
    if (!reservation) {
      return reservation
        .status(404)
        .json({ message: 'Reservation with provided ID not found' });
    }
    reservation.status = 'Canceled';
    await reservation.save();
    res.status(200).json({ message: 'Reservation is now canceled' });
  } catch (err) {
    console.log('err:', err);
    return res.status(500).json({
      message: 'Unexpected error occured. Please try again.',
    });
  }
};
