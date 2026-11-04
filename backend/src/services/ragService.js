
const axios = require('axios');
const FormData = require('form-data');

function getConfig(timeout = 30000) {
  const baseURL = process.env.RAG_SERVICE_URL?.replace(/\/+$/, '');
  const apiKey = process.env.RAG_API_KEY;

  if (!baseURL || !apiKey) {
    throw new Error('RAG_SERVICE_URL or RAG_API_KEY is missing');
  }

  return {
    baseURL,
    headers: {
      'X-API-Key': apiKey
    },
    timeout
  };
}

// Ask a question using RAG
async function chat({ question, userId, courseId, sessionId, docIds, mode = 'strict' }) {
  const config = getConfig(90000);

  const response = await axios.post(
    `${config.baseURL}/api/v1/chat`,
    {
      question,
      user_id: String(userId),
      course_id: courseId || 'global',
      session_id: sessionId || null,
      doc_ids: docIds || null,
      mode
    },
    {
      headers: config.headers,
      timeout: config.timeout
    }
  );

  return response.data;
}

// Upload a document to RAG
async function ingest({ file, userId, courseId, scope }) {
  const config = getConfig(180000);
  const form = new FormData();

  form.append('file', file.buffer, {
    filename: file.originalname,
    contentType: file.mimetype
  });

  form.append('user_id', String(userId));
  form.append('course_id', courseId || 'global');
  form.append('scope', scope || 'private');

  const response = await axios.post(
    `${config.baseURL}/api/v1/ingest`,
    form,
    {
      headers: {
        ...form.getHeaders(),
        ...config.headers
      },
      maxBodyLength: Infinity,
      timeout: config.timeout
    }
  );

  return response.data;
}

// Retrieve uploaded documents
async function getDocuments({ userId, courseId }) {
  const config = getConfig();

  const response = await axios.get(
    `${config.baseURL}/api/v1/documents`,
    {
      headers: config.headers,
      params: {
        user_id: String(userId),
        ...(courseId ? { course_id: courseId } : {})
      },
      timeout: config.timeout
    }
  );

  return response.data;
}

// Delete a document
async function deleteDocument({ docId, userId, allowShared = false }) {
  const config = getConfig();

  const response = await axios.delete(
    `${config.baseURL}/api/v1/documents/${encodeURIComponent(docId)}`,
    {
      headers: config.headers,
      params: {
        user_id: String(userId),
        ...(allowShared ? { allow_shared: true } : {})
      },
      timeout: config.timeout
    }
  );

  return response.data;
}

module.exports = {
  chat,
  ingest,
  getDocuments,
  deleteDocument
};
