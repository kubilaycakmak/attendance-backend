import mongoose from "mongoose";

const userSchema = mongoose.Schema({
    username:String,
    full_name:String,
    password:String,
    email:String,
    type:String,
    created_at: String,
})

const User = mongoose.model("User", userSchema);

export default User;