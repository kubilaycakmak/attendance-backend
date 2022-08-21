import mongoose from "mongoose";

const userSchema = mongoose.Schema({
    username:String,
    full_name:String,
    password: String,
    profile_icture: String,
    email:String,
    type:String,
    created_at: String,
    used_google_account: Boolean,
},{ timestamps: true })

const User = mongoose.model("User", userSchema);

export default User;