import mongoose from 'mongoose';

const reservationSchema = mongoose.Schema({
  name: String,
  type: String,
  user_id: String,
  room_id: String,
  status: String,
  startDate: Date,
  endDate: Date,
  startTime: Date,
  endTime: Date,
  duration: Number,
});

const Reservation = mongoose.model('Reservation', reservationSchema);

export default Reservation;
