const multer = require('multer');

module.exports = function createUploadMiddleware(maxBytes) {
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: maxBytes },
  }).single('file');

  return (req, res, next) => {
    upload(req, res, (error) => {
      if (!error) return next();
      if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ error: 'The selected file is too large.', code: 'FILE_TOO_LARGE' });
      }
      return res.status(400).json({ error: 'The uploaded file could not be processed.' });
    });
  };
};
