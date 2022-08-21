import mongoose from "mongoose";

const userSchema = mongoose.Schema({
    username:String,
    full_name:String,
    password: String,
    profile_picture: String,
    email:String,
    type:String,
    used_google_account: Boolean,
},{ timestamps: true })

const User = mongoose.model("User", userSchema);

export default User;