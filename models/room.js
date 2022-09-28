import mongoose from 'mongoose';

const roomSchema = mongoose.Schema({
  name: String,
  type: String,
  floor: Number,
  description: String,
  picture_url: String,
  total_seats: Number,
});

const Room = mongoose.model('Room', roomSchema);

export default Room;
