import express from 'express';
import Room from '../models/room.js';
import Reservation from '../models/reservation.js';
import decodeJWT from '../middleware/check_auth.js';
import upload from '../middleware/multer.js';
import checkIsCoordinator from '../middleware/check_is_coorinator.js';
import fileUploadHelper from '../helpers/flileUploadHelper.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const rooms = await Room.find();
    return res.status(200).json(rooms);
  } catch (err) {
    console.log(err);
    return res.status(500).json(err);
  }
});

router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const room = await Room.findById(id);
    if (!room) {
      return res.status(404).json({
        message: 'not such room',
      });
    }

    return res.status(200).json({
      room,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json(err);
  }
});

router.post('/', decodeJWT, checkIsCoordinator, async (req, res) => {
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
});

router.post('/:id/update-photo', upload.single('photo'), async (req, res) => {
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
});

router.put('/:id', decodeJWT, checkIsCoordinator, async (req, res) => {
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
});

router.delete('/:id', checkIsCoordinator, async (req, res) => {
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
});

export default router;
