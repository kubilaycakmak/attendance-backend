import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();
mongoose.Promise = global.Promise;

// process.env.CONNECTION_URL comes from .env file
let db = mongoose.connect(process.env.CONNECTION_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}, (err) => {
    if (!err) {
        console.log('MongoDB Connection Succeeded.')
    } else {
        console.log('Error in DB connection: ' + err)
    }
});

export default db