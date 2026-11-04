
const express = require('express');
const multer = require('multer');

const router = express.Router();

const aiController = require('../controllers/aiController');
const authMiddleware = require('../middleware/auth');

const maxUploadMB = Number(process.env.MAX_RAG_UPLOAD_MB || 20);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: maxUploadMB * 1024 * 1024
  }
});

// All AI routes require JWT authentication
router.use(authMiddleware);

// RAG endpoints
router.post('/chat', aiController.chat);

router.post(
  '/ingest',
  upload.single('file'),
  aiController.ingest
);

router.get('/documents', aiController.getDocuments);

router.delete(
  '/documents/:docId',
  aiController.deleteDocument
);

router.use('/tutor', require('./aiTutor'));
router.use('/materials', require('./aiTutorMaterials'));

module.exports = router;
