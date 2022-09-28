import express from 'express';
import jwt from 'jsonwebtoken';
import moment from 'moment';
import fs from 'fs';
import Room from '../models/room.js';
import Reservation from '../models/reservation.js';
import decodeJWT from '../middleware/check_auth.js';
import upload from '../middleware/multer.js';
import cloudinary from '../config/cloudStorage.js';

const router = express.Router();

export default router;
