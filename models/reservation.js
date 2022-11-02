import mongoose from 'mongoose';

const reservationSchema = mongoose.Schema({
  type: String,
  user_id: String,
  room_id: String,
  status: String,
  start_date: String,
  end_date: String,
  start_time: String,
  end_time: String,
  duration: Number,
  actual_end_date: String,
});

const Reservation = mongoose.model('Reservation', reservationSchema);

export default Reservation;
