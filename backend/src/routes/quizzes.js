
const express = require('express');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');

const authMiddleware = require('../middleware/auth');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024,
    files: 10,
  },
});

const handleUpload = (req, res, next) => {
  upload.array('files', 10)(req, res, (err) => {
    if (err) {
      const status = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
      return res.status(status).json({ error: err.message });
    }
    next();
  });
};

router.post(
  '/generate',
  authMiddleware,
  handleUpload,
  async (req, res) => {
    try {
      const files = req.files || [];

      if (files.length === 0) {
        return res.status(400).json({
          error: 'Please upload at least one file.',
        });
      }

      const rawIds = req.body.material_ids;
      const materialIds = Array.isArray(rawIds)
        ? rawIds
        : rawIds
          ? [rawIds]
          : [];

      if (materialIds.length !== files.length) {
        return res.status(400).json({
          error: 'Each uploaded file must have a material ID.',
        });
      }

      const numQuestions = Number(req.body.num_questions || 10);
      const difficulty = req.body.difficulty || 'medium';

      if (!Number.isInteger(numQuestions) || numQuestions < 1 || numQuestions > 50) {
        return res.status(400).json({
          error: 'Number of questions must be between 1 and 50.',
        });
      }

      if (!['easy', 'medium', 'hard', 'mixed'].includes(difficulty)) {
        return res.status(400).json({
          error: 'Invalid difficulty level.',
        });
      }

      const form = new FormData();

      files.forEach((file, index) => {
        form.append('files', file.buffer, {
          filename: file.originalname,
          contentType: file.mimetype,
        });

        form.append('material_ids', materialIds[index]);
      });

      form.append('num_questions', String(numQuestions));
      form.append('difficulty', difficulty);

      const serviceUrl =
        process.env.QUIZ_SERVICE_URL || 'http://localhost:8002';

      const headers = {
        ...form.getHeaders(),
      };

      if (process.env.QUIZ_SERVICE_API_KEY) {
        headers['X-API-Key'] = process.env.QUIZ_SERVICE_API_KEY;
      }

      const response = await axios.post(
        `${serviceUrl.replace(/\/$/, '')}/generate-quiz`,
        form,
        {
          headers,
          maxBodyLength: Infinity,
          timeout: 180000,
        }
      );

      return res.json(response.data);

    } catch (error) {
      console.error(
        'Quiz generation error:',
        error.response?.data || error.message
      );

      if (error.response) {
        return res.status(error.response.status).json({
          error:
            error.response.data?.detail ||
            error.response.data?.error ||
            'Quiz generation failed.',
        });
      }

      return res.status(502).json({
        error: 'Unable to connect to the Python quiz service.',
      });
    }
  }
);

module.exports = router;
