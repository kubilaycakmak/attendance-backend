import Room from '../models/room.js';
import Reservation from '../models/reservation.js';
import fileUploadHelper from '../helpers/flileUploadHelper.js';
import { validateReservation } from '../helpers/roomHelpers.js';
import getNextAvailableTime from '../helpers/getNextAvailableTime.js';

export const getAllRoomsInfo = async (req, res) => {
  try {
    const rooms = await Room.find();
    return res.status(200).json(rooms);
  } catch (err) {
    console.log(err);
    return res.status(500).json(err);
  }
};

export const getRoomInfo = async (req, res) => {
  const { id } = req.params;

  try {
    const room = await Room.findById(id);
    if (!room) {
      return res.status(404).json({
        message: 'not such room',
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
    console.log(err);
    return res.status(500).json(err);
  }
};

export const createNewRoom = async (req, res) => {
  try {
    const room = await Room.create({
      ...req.body,
    });
    return res
      .status(201)
      .json({ room, message: 'room is created successfully!!!' });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

export const updateRoomInfo = async (req, res) => {
  const { id } = req.params;
  const { name, type, floor, description, picture_url, total_seats } = req.body;
  try {
    const room = await Room.findById(id);

    if (!room) {
      return res.status(404).json({
        message: 'not such room',
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
      message: 'room is updated successfully!!!',
    });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

export const updateRoomPhoto = async (req, res) => {
  const { id } = req.params;
  try {
    const room = await Room.findById(id);
    if (!room) {
      return res.status(200).json({
        message: 'not such room',
      });
    }
    const result = await fileUploadHelper(req.file.filename, id, 'rooms');

    room.picture_url = result.url;
    await room.save();

    return res.status(200).json({
      room,
      message: 'room photo is updated successfully!!!',
    });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

export const deleteRoom = async (req, res) => {
  const { id } = req.params;
  try {
    const room = await Room.findById(id);
    if (!room) {
      return res.status(404).json({
        message: 'no such room.',
      });
    }

    await Room.findByIdAndDelete(id);

    res.status(200).json({
      message: 'room is deleted successfully!',
    });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
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
    res.status(500).json({ message: 'unexpected error occured' });
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
    res.status(500).json({ message: 'unexpected error occured' });
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
};

export const confirmReservation = async (req, res) => {
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
};

export const cancelReservation = async (req, res) => {
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
};
