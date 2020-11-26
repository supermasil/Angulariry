const multer = require('multer');
const path = require('path');

const MIME_TYPE_MAP = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png'
};
const storage = multer.diskStorage ({
  destination: (req, file, cb) => {
    const isValid = MIME_TYPE_MAP[file.mimetype];
    let error = new Error('Invalid mime type');
    if (isValid) {
      error = null;
    }
    let directory = path.join(__dirname, '../tmp');
    cb(null, directory); // path to images folder, relative to server.js folder
  },
  filename: (req, file, cb) => {
    const name = file.originalname.toLowerCase().split(' ').join('-');
    const ext = MIME_TYPE_MAP[file.mimetype];
    cb(null, name + '-' + Date.now() + '.' + ext);
  }
});
// module.exports = multer({storage: storage});
module.exports = multer({limits: { fieldSize: 30 * 1024 * 1024 }}); // No need multer for now
