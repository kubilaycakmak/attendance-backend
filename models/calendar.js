import mongoose from "mongoose";

const calendarSchema = mongoose.Schema({
    object_id: mongoose.SchemaTypes.ObjectId,
    dates: Array
});

const Calendar = mongoose.model("Calendar", calendarSchema);

export default Calendar;