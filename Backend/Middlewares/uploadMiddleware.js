import multer from "multer";
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: Number(process.env.MAX_UPLOAD_BYTES || 104857600), files: 10 }, fileFilter: (_req, file, cb) => { if (!file.originalname || file.originalname.length > 255) return cb(new Error("Invalid file name")); if (!/^[\w .()\-\[\]]+$/.test(file.originalname)) return cb(new Error("File name contains unsupported characters")); cb(null, true); } });
export default upload;
