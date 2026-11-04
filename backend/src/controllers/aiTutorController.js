const { randomUUID } = require('crypto');
const path = require('path');
const config = require('../config/aiTutor');
const tutorModel = require('../models/aiTutorModel');
const ragService = require('../services/ragService');

const MAX_QUESTION_LENGTH = 4000;

function getUserId(req) {
  return String(req.user.id);
}

function getCourse(req, res, courseId) {
  if (!Object.prototype.hasOwnProperty.call(config.courses, courseId)) {
    res.status(400).json({ error: 'Select a valid course.', code: 'INVALID_COURSE' });
    return null;
  }
  return config.courses[courseId];
}

function sendRagError(res, error) {
  const status = error.response?.status;
  if (status === 401) {
    return res.status(502).json({
      error: 'The document service rejected its API key. Ensure backend RAG_API_KEY matches rag_service SERVICE_API_KEY.',
      code: 'RAG_API_KEY_MISMATCH',
    });
  }
  if (status === 422) {
    return res.status(422).json({
      error: 'This document has no readable text. Scanned PDFs are not supported yet.',
      code: 'NO_READABLE_TEXT',
    });
  }
  if (status === 413) {
    return res.status(413).json({ error: 'The file is larger than the RAG service limit.' });
  }
  if (status === 429) {
    return res.status(429).json({ error: 'The document service is busy. Please try again.' });
  }
  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
    return res.status(504).json({ error: 'The document service timed out. Please try again.' });
  }
  if (
    (status !== undefined && status >= 500) ||
    (error.isAxiosError && status === undefined) ||
    error.code === 'ECONNREFUSED' ||
    (typeof error.message === 'string' && error.message.includes('RAG_SERVICE_URL or RAG_API_KEY'))
  ) {
    return res.status(502).json({ error: 'The document service is unavailable. Please try again shortly.' });
  }
  if (!status || status >= 500) {
    console.error('Tutor persistence operation failed:', error.message);
    return res.status(500).json({ error: 'Tutor data could not be saved or loaded.' });
  }
  const detail = error.response?.data?.detail;
  return res.status(status).json({
    error: typeof detail === 'string' ? detail : 'The document service rejected the request.',
  });
}

function getPdfValidationError(file) {
  if (path.extname(file.originalname || '').toLowerCase() !== '.pdf') {
    return 'Only PDF files can be uploaded here.';
  }
  if (file.mimetype !== 'application/pdf') {
    return 'The selected file must have PDF content type.';
  }
  if (!file.buffer.subarray(0, 5).equals(Buffer.from('%PDF-'))) {
    return 'The selected file is not a valid PDF.';
  }
  return null;
}

async function removeRagDocument(docId, userId, allowShared = false) {
  await ragService.deleteDocument({ docId, userId, allowShared });
}

exports.listCourses = (_req, res) => {
  return res.json(
    Object.entries(config.courses).map(([id, course]) => ({
      id,
      title: course.title,
    })),
  );
};

exports.listCourseMaterials = async (req, res) => {
  const course = getCourse(req, res, req.query.courseId);
  if (!course) return;
  try {
    const docs = await ragService.getDocuments({
      userId: getUserId(req),
      courseId: course.ragCourseId,
    });
    const materials = docs
      .filter((doc) => doc.scope === 'shared')
      .filter((doc) => doc.course_id === 'global' || doc.course_id === course.ragCourseId)
      .map((doc) => ({
        id: doc.doc_id,
        filename: doc.filename,
        courseId: doc.course_id,
      }));
    return res.json(materials);
  } catch (error) {
    return sendRagError(res, error);
  }
};

exports.uploadPrivateDocument = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Choose a PDF to upload.' });
  const validationError = getPdfValidationError(req.file);
  if (validationError) return res.status(400).json({ error: validationError });

  const userId = getUserId(req);
  let reservation;
  try {
    reservation = await tutorModel.reservePrivateDocument(
      userId,
      req.file.originalname,
      req.file.size,
      config.maxPdfs,
    );
    if (!reservation.row) {
      return res.status(409).json({
        error: 'Delete one of your PDFs before uploading another.',
        code: 'PDF_LIMIT_REACHED',
        limit: reservation.limit,
        used: reservation.used,
      });
    }

    const ingested = await ragService.ingest({
      file: req.file,
      userId,
      courseId: 'global',
      scope: 'private',
    });
    try {
      await tutorModel.completePrivateDocument(
        reservation.row.id,
        userId,
        ingested.doc_id,
      );
    } catch (error) {
      try {
        await removeRagDocument(ingested.doc_id, userId);
      } catch (cleanupError) {
        console.error('Failed to remove a RAG document after database persistence failed:', cleanupError.message);
      }
      throw error;
    }

    return res.status(201).json({
      id: reservation.row.id,
      docId: ingested.doc_id,
      filename: ingested.filename,
      sizeBytes: req.file.size,
      status: 'ready',
      createdAt: reservation.row.created_at,
      limit: reservation.limit,
      used: reservation.used,
    });
  } catch (error) {
    if (reservation?.row) {
      try {
        await tutorModel.deletePrivateDocument(reservation.row.id, userId);
      } catch (cleanupError) {
        console.error('Failed to remove a reserved tutor document row:', cleanupError.message);
      }
    }
    if (error.response || error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return sendRagError(res, error);
    }
    console.error('Tutor document upload failed:', error.message);
    return res.status(500).json({ error: 'The PDF could not be saved. Please try again.' });
  }
};

exports.listDocuments = async (req, res) => {
  const course = getCourse(req, res, req.query.courseId);
  if (!course) return;
  const userId = getUserId(req);
  try {
    const [privateDocs, ragDocs] = await Promise.all([
      tutorModel.listPrivateDocuments(userId),
      ragService.getDocuments({ userId, courseId: course.ragCourseId }),
    ]);
    const shared = ragDocs
      .filter((doc) => doc.scope === 'shared')
      .filter((doc) => doc.course_id === 'global' || doc.course_id === course.ragCourseId)
      .map((doc) => ({
        id: doc.doc_id,
        filename: doc.filename,
        courseId: doc.course_id,
      }));
    return res.json({
      limit: config.maxPdfs,
      maxFileMb: config.maxPdfMb,
      used: privateDocs.length,
      private: privateDocs.map((doc) => ({
        ...doc,
        sizeBytes: Number(doc.sizeBytes),
      })),
      shared,
    });
  } catch (error) {
    return sendRagError(res, error);
  }
};

exports.deletePrivateDocument = async (req, res) => {
  if (!/^\d+$/.test(req.params.id)) return res.status(404).json({ error: 'PDF not found.' });
  const userId = getUserId(req);
  try {
    const document = await tutorModel.getPrivateDocument(req.params.id, userId);
    if (!document) return res.status(404).json({ error: 'PDF not found.' });
    await removeRagDocument(document.docId, userId);
    await tutorModel.deletePrivateDocument(document.id, userId);
    return res.json({ deleted: document.id });
  } catch (error) {
    return sendRagError(res, error);
  }
};

exports.chat = async (req, res) => {
  const { question, courseId, conversationId, docIds } = req.body || {};
  if (typeof question !== 'string' || !question.trim() || question.length > MAX_QUESTION_LENGTH) {
    return res.status(400).json({
      error: `Question must contain 1-${MAX_QUESTION_LENGTH} characters.`,
    });
  }
  const course = getCourse(req, res, courseId);
  if (!course) return;
  if (docIds !== undefined && (!Array.isArray(docIds) || docIds.some((id) => typeof id !== 'string'))) {
    return res.status(400).json({ error: 'docIds must be an array of document IDs.' });
  }
  if (docIds !== undefined && docIds.length === 0) {
    return res.status(400).json({ error: 'Select at least one document or omit docIds.' });
  }

  const userId = getUserId(req);
  let conversation;
  let isNewConversation = false;
  try {
    if (conversationId !== undefined && conversationId !== null) {
      if (!/^\d+$/.test(String(conversationId))) {
        return res.status(404).json({ error: 'Conversation not found for this course.' });
      }
      conversation = await tutorModel.getConversation(conversationId, userId);
      if (!conversation || conversation.courseId !== courseId) {
        return res.status(404).json({ error: 'Conversation not found for this course.' });
      }
    } else {
      const ragSessionId = randomUUID();
      conversation = await tutorModel.createConversation({
        userId,
        courseId,
        ragSessionId,
        title: question.trim().slice(0, 120),
      });
      conversation.ragSessionId = ragSessionId;
      isNewConversation = true;
    }

    let allowedDocIds;
    if (docIds !== undefined) {
      const [privateIds, visibleDocs] = await Promise.all([
        tutorModel.getOwnedPrivateDocIds(userId),
        ragService.getDocuments({ userId, courseId: course.ragCourseId }),
      ]);
      const allowed = new Set([
        ...privateIds,
        ...visibleDocs
          .filter((doc) => doc.scope === 'shared')
          .filter((doc) => doc.course_id === 'global' || doc.course_id === course.ragCourseId)
          .map((doc) => doc.doc_id),
      ]);
      allowedDocIds = [...new Set(docIds)].filter((id) => allowed.has(id));
      if (docIds.length > 0 && allowedDocIds.length === 0) {
        if (isNewConversation) await tutorModel.deleteConversation(conversation.id, userId);
        return res.status(403).json({ error: 'None of the selected documents are available to you.' });
      }
    }

    const result = await ragService.chat({
      question: question.trim(),
      userId,
      courseId: course.ragCourseId,
      sessionId: conversation.ragSessionId,
      docIds: allowedDocIds,
      mode: 'hybrid',
    });
    const sources = Array.isArray(result.sources) ? result.sources : [];
    const grounded = result.grounded === true;
    await tutorModel.saveConversationTurn(
      conversation.id,
      question.trim(),
      result.answer,
      sources,
      grounded,
    );
    return res.json({
      conversationId: conversation.id,
      answer: result.answer,
      sources,
      grounded,
    });
  } catch (error) {
    if (isNewConversation && conversation?.id) {
      try {
        await tutorModel.deleteConversation(conversation.id, userId);
      } catch (cleanupError) {
        console.error('Failed to remove an empty tutor conversation:', cleanupError.message);
      }
    }
    return sendRagError(res, error);
  }
};

exports.listConversations = async (req, res) => {
  try {
    return res.json(await tutorModel.listConversations(getUserId(req)));
  } catch (error) {
    console.error('Tutor conversation listing failed:', error.message);
    return res.status(500).json({ error: 'Conversation history is unavailable.' });
  }
};

exports.getConversation = async (req, res) => {
  if (!/^\d+$/.test(req.params.id)) return res.status(404).json({ error: 'Conversation not found.' });
  try {
    const conversation = await tutorModel.getConversation(req.params.id, getUserId(req));
    if (!conversation) return res.status(404).json({ error: 'Conversation not found.' });
    const messages = await tutorModel.listMessages(conversation.id);
    return res.json({
      conversation: {
        id: conversation.id,
        courseId: conversation.courseId,
        title: conversation.title,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
      },
      messages,
    });
  } catch (error) {
    console.error('Tutor conversation retrieval failed:', error.message);
    return res.status(500).json({ error: 'Conversation could not be loaded.' });
  }
};

exports.deleteConversation = async (req, res) => {
  if (!/^\d+$/.test(req.params.id)) return res.status(404).json({ error: 'Conversation not found.' });
  try {
    const result = await tutorModel.deleteConversation(req.params.id, getUserId(req));
    if (!result.rowCount) return res.status(404).json({ error: 'Conversation not found.' });
    return res.json({ deleted: req.params.id });
  } catch (error) {
    console.error('Tutor conversation deletion failed:', error.message);
    return res.status(500).json({ error: 'Conversation could not be deleted.' });
  }
};

exports.listMaterials = async (req, res) => {
  const course = getCourse(req, res, req.query.courseId);
  if (!course) return;
  try {
    const docs = await ragService.getDocuments({
      userId: getUserId(req),
      courseId: course.ragCourseId,
    });
    let managedIds = new Set();
    try {
      managedIds = await tutorModel.listSharedDocumentIds(course.ragCourseId);
    } catch (error) {
      console.error('Unable to load shared material management metadata:', error.message);
    }
    const materialList = docs
      .filter((doc) => doc.scope === 'shared')
      .filter((doc) => doc.course_id === 'global' || doc.course_id === course.ragCourseId)
      .map((doc) => ({
        id: doc.doc_id,
        filename: doc.filename,
        courseId: doc.course_id,
        canDelete: managedIds.has(doc.doc_id),
      }));
    return res.json(materialList);
  } catch (error) {
    return sendRagError(res, error);
  }
};

exports.uploadMaterial = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Choose a course material to upload.' });
  const extension = path.extname(req.file.originalname || '').toLowerCase();
  const allowedTypes = {
    '.pdf': ['application/pdf'],
    '.docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    '.pptx': ['application/vnd.openxmlformats-officedocument.presentationml.presentation'],
    '.txt': ['text/plain'],
    '.md': ['text/markdown', 'text/plain'],
  };
  if (!allowedTypes[extension] || !allowedTypes[extension].includes(req.file.mimetype)) {
    return res.status(400).json({ error: 'Upload a PDF, DOCX, PPTX, TXT, or MD file with a matching file type.' });
  }
  if (extension === '.pdf' && !req.file.buffer.subarray(0, 5).equals(Buffer.from('%PDF-'))) {
    return res.status(400).json({ error: 'The selected file is not a valid PDF.' });
  }
  const course = getCourse(req, res, req.body.courseId);
  if (!course) return;

  const userId = getUserId(req);
  let ingested;
  try {
    ingested = await ragService.ingest({
      file: req.file,
      userId,
      courseId: course.ragCourseId,
      scope: 'shared',
    });
    try {
      const saved = await tutorModel.createSharedDocument({
        uploadedBy: userId,
        courseId: course.ragCourseId,
        ragDocId: ingested.doc_id,
        filename: ingested.filename,
        sizeBytes: req.file.size,
      });
      return res.status(201).json({
        ...saved,
        courseId: req.body.courseId,
        ragCourseId: course.ragCourseId,
      });
    } catch (error) {
      try {
        await removeRagDocument(ingested.doc_id, userId, true);
      } catch (cleanupError) {
        console.error('Failed to remove a shared RAG document after database persistence failed:', cleanupError.message);
      }
      throw error;
    }
  } catch (error) {
    if (error.response || error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return sendRagError(res, error);
    }
    console.error('Course material upload failed:', error.message);
    return res.status(500).json({ error: 'The course material could not be saved.' });
  }
};

exports.deleteMaterial = async (req, res) => {
  const userId = getUserId(req);
  try {
    const document = await tutorModel.getSharedDocument(req.params.id);
    if (!document) return res.status(404).json({ error: 'Course material not found.' });
    if (req.user.role !== 'admin' && document.uploadedBy !== userId) {
      return res.status(403).json({ error: 'You can only delete materials you uploaded.' });
    }
    await removeRagDocument(document.docId, userId, true);
    await tutorModel.deleteSharedDocument(document.id);
    return res.json({ deleted: document.id });
  } catch (error) {
    return sendRagError(res, error);
  }
};
