import multer from 'multer';
import path from 'path';

const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, 
}).array('file', 10);

export default upload ;