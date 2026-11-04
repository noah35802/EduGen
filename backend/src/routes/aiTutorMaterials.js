const express = require('express');
const aiTutorController = require('../controllers/aiTutorController');
const config = require('../config/aiTutor');
const tutorModel = require('../models/aiTutorModel');
const roleCheck = require('../middleware/roleCheck');
const rateLimit = require('../middleware/aiTutorRateLimit');
const upload = require('../middleware/aiTutorUpload');

const router = express.Router();
const uploadMaterial = upload(config.maxSharedUploadMb * 1024 * 1024);

router.get('/', aiTutorController.listMaterials);

router.use((req, res, next) => {
  tutorModel.initialize().then(() => next()).catch((error) => {
    console.error('Tutor database initialization failed:', error.message);
    res.status(500).json({ error: 'Tutor storage is unavailable.', code: 'DATABASE_ERROR' });
  });
});

router.post(
  '/',
  roleCheck('teacher', 'admin'),
  rateLimit.upload,
  uploadMaterial,
  aiTutorController.uploadMaterial,
);
router.delete('/:id', roleCheck('teacher', 'admin'), aiTutorController.deleteMaterial);

module.exports = router;
