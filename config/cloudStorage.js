import { v2 as cloudinary } from "cloudinary";
import dotenv from 'dotenv'
dotenv.config();

cloudinary.config({ 
    cloud_name: 'ditucvfmr', 
    api_key: process.env.STORAGE_API_KEY, 
    api_secret: process.env.STORAGE_API_SECRET
});


export default cloudinary