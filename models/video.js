import mongoose from 'mongoose';

const videoSchema = mongoose.Schema({
  userId: mongoose.Types.ObjectId,
  title: String,
  url: String,
  likes: [mongoose.Types.ObjectId],
});

const Video = mongoose.model('Video', videoSchema);

export default Video;
