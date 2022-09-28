import mongoose from 'mongoose';

const calendarSchema = mongoose.Schema({
  object_id: mongoose.SchemaTypes.ObjectId,
  dates: [mongoose.SchemaTypes.ObjectId],
});

const Calendar = mongoose.model('Calendar', calendarSchema);

export default Calendar;
