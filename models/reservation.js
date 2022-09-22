import mongoose from "mongoose";

const reservationSchema = mongoose.Schema({
    user_id: String,
    place: String,
    place_pictrue: String
})

const Reservation = mongoose.model("Reservation", reservationSchema);

export default Reservation;

