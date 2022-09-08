import mongoose from "mongoose";

const appointmentSchema = mongoose.Schema({
    created_by: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: "User"
    }, 
    target_user: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: "User"
    },  
    // date: String,
    // start_time: String,
    // end_time: String
    date: {
        start: Date,
        end: Date
    },
    is_confirmed: Boolean

});

const Appointment = mongoose.model("Appointment", appointmentSchema);

export default Appointment;