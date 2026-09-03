const multer = require('multer');
const path = require('path');

// Configure disk storage for temporary file holding
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Files will be temporarily saved in the 'uploads' folder
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    // Generate a unique filename using timestamp
    cb(null, `issue-${Date.now()}${path.extname(file.originalname)}`);
  }
});

// File validation to ensure only images are uploaded
const fileFilter = (req, file, cb) => {
  const allowedFileTypes = /jpeg|jpg|png|webp/;
  
  // Check extension
  const extname = allowedFileTypes.test(path.extname(file.originalname).toLowerCase());
  // Check mime type
  const mimetype = allowedFileTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Images only! (jpeg, jpg, png, webp allowed)'), false);
  }
};

// Initialize Multer
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
  fileFilter: fileFilter
});

module.exports = upload;
