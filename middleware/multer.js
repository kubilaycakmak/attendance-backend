import multer from 'multer';

const fileStorageEngine = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, ".");
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    }
})

const upload = multer({ storage: fileStorageEngine });

export default upload