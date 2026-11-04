const express = require('express');
const aiTutorController = require('../controllers/aiTutorController');
const config = require('../config/aiTutor');
const tutorModel = require('../models/aiTutorModel');
const roleCheck = require('../middleware/roleCheck');
const rateLimit = require('../middleware/aiTutorRateLimit');
const upload = require('../middleware/aiTutorUpload');

const router = express.Router();
const uploadPdf = upload(config.maxPdfMb * 1024 * 1024);

router.use(roleCheck('student'));

router.get('/courses', aiTutorController.listCourses);
router.get('/materials', aiTutorController.listCourseMaterials);

router.use((req, res, next) => {
  tutorModel.initialize().then(() => next()).catch((error) => {
    console.error('Tutor database initialization failed:', error.message);
    res.status(500).json({ error: 'Tutor storage is unavailable.', code: 'DATABASE_ERROR' });
  });
});

router.get('/documents', aiTutorController.listDocuments);
router.post('/documents', rateLimit.upload, uploadPdf, aiTutorController.uploadPrivateDocument);
router.delete('/documents/:id', aiTutorController.deletePrivateDocument);
router.post('/chat', rateLimit.chat, aiTutorController.chat);
router.get('/conversations', aiTutorController.listConversations);
router.get('/conversations/:id', aiTutorController.getConversation);
router.delete('/conversations/:id', aiTutorController.deleteConversation);

module.exports = router;
