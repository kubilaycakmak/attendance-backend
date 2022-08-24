import mongoose from "mongoose";

const appointmentSchema = mongoose.Schema({
    user_id: String,
    date: String
});

const Appointment = mongoose.model("Appointment", appointmentSchema);

export default Appointment;