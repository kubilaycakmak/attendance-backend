import mongoose from 'mongoose';

const appointmentSchema = mongoose.Schema({
  created_by: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: 'User',
  },
  target_user: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: 'User',
  },
  // date: {
  //     start: Date,
  //     end: Date
  // },
  datetime: Number,
  status: String,
});

const Appointment = mongoose.model('Appointment', appointmentSchema);

export default Appointment;
