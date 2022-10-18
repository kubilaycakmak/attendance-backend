import cloudinary from '../config/cloudStorage.js';
import fs from 'fs';

const fileUploadHelper = async (filename, id, foldername) => {
  const result = await cloudinary.uploader.upload(filename, {
    public_id: id,
    folder: `attendance/${foldername}`,
    overwrite: true,
  });

  fs.unlink(`${filename}`, (err) => {
    if (err) throw err;
    console.log('file successfully deleted');
  });
  return result;
};

export default fileUploadHelper;
