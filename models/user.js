import mongoose from 'mongoose';

const userSchema = mongoose.Schema({
  username: String,
  full_name: String,
  password: String,
  email: String,
  role: Array,
  created_at: String,
  current_program: String,
  invited_by: String,
  used_google_account: Boolean,
  photo: String,
  social: {
    discord: String,
    slack: String,
    linkedin: String,
  },
});

const User = mongoose.model('User', userSchema);

export default User;
