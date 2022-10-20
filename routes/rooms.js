import express from 'express';
import decodeJWT from '../middleware/checkAuth.js';
import upload from '../middleware/multer.js';
import checkIsCoordinator from '../middleware/checkIsCoorinator.js';
import {
  getAllRoomsInfo,
  getRoomInfo,
  createNewRoom,
  updateRoomInfo,
  updateRoomPhoto,
  deleteRoom,
  cancelReservation,
  confirmReservation,
  getAllReservations,
  getAllReservationsOfRoom,
  createNewReservation,
} from '../controllers/roomController.js';

const router = express.Router();

router.get('/', getAllRoomsInfo);
router.get('/:id', getRoomInfo);
router.post('/', decodeJWT, checkIsCoordinator, createNewRoom);
router.post(
  '/:id/update-photo',
  decodeJWT,
  checkIsCoordinator,
  upload.single('photo'),
  updateRoomPhoto
);
router.put('/:id', decodeJWT, checkIsCoordinator, updateRoomInfo);
router.delete('/:id', decodeJWT, checkIsCoordinator, deleteRoom);
router.get('/reservations', decodeJWT, getAllReservations);
router.post('/reservations', decodeJWT, createNewReservation);
router.put(
  '/reservations/:reservationId/confirm',
  decodeJWT,
  confirmReservation
);
router.put('/reservations/:reservationId/cancel', decodeJWT, cancelReservation);
router.get('/:room_id/reservations', decodeJWT, getAllReservationsOfRoom);

export default router;
