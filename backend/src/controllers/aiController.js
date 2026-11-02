
const ragService = require('../services/ragService');

function handleError(res, error) {
  console.error('RAG integration error:', error.message);

  const status =
    error.response?.status ||
    (error.code === 'ECONNABORTED' ? 504 : 502);

  const message =
    error.response?.data?.detail ||
    error.response?.data?.message ||
    (status === 504
      ? 'RAG service timed out.'
      : 'RAG service is unavailable or request failed.');

  return res.status(status).json({
    success: false,
    message
  });
}

function getAuthenticatedUserId(req, res) {
  const userId = req.user?.id;

  if (userId === undefined || userId === null) {
    res.status(401).json({
      error: 'Authentication required'
    });
    return null;
  }

  return String(userId);
}

// POST /api/ai/chat
exports.chat = async (req, res) => {
  const userId = getAuthenticatedUserId(req, res);
  if (!userId) return;

  const {
    question,
    course_id,
    session_id,
    doc_ids
  } = req.body || {};

  if (typeof question !== 'string' || !question.trim()) {
    return res.status(400).json({
      error: 'Question is required'
    });
  }

  try {
    const result = await ragService.chat({
      question: question.trim(),
      userId,
      courseId: course_id,
      sessionId: session_id,
      docIds: doc_ids
    });

    return res.json(result);
  } catch (error) {
    return handleError(res, error);
  }
};

// POST /api/ai/ingest
exports.ingest = async (req, res) => {
  const userId = getAuthenticatedUserId(req, res);
  if (!userId) return;

  if (!req.file) {
    return res.status(400).json({
      error: 'Please upload a file'
    });
  }

  const courseId = req.body.course_id || 'global';
  const scope = req.body.scope || 'private';

  if (!['private', 'shared'].includes(scope)) {
    return res.status(400).json({
      error: 'Invalid document scope'
    });
  }

  if (scope === 'shared' && req.user.role !== 'teacher') {
    return res.status(403).json({
      error: 'Only teachers can upload shared documents'
    });
  }

  try {
    const result = await ragService.ingest({
      file: req.file,
      userId,
      courseId,
      scope
    });

    return res.status(201).json(result);
  } catch (error) {
    return handleError(res, error);
  }
};

// GET /api/ai/documents
exports.getDocuments = async (req, res) => {
  const userId = getAuthenticatedUserId(req, res);
  if (!userId) return;

  try {
    const result = await ragService.getDocuments({
      userId,
      courseId: req.query.course_id
    });

    return res.json(result);
  } catch (error) {
    return handleError(res, error);
  }
};

// DELETE /api/ai/documents/:docId
exports.deleteDocument = async (req, res) => {
  const userId = getAuthenticatedUserId(req, res);
  if (!userId) return;

  try {
    const result = await ragService.deleteDocument({
      docId: req.params.docId,
      userId
    });

    return res.json(result);
  } catch (error) {
    return handleError(res, error);
  }
};
