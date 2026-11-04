const pool = require('../db');

let initialization;

async function initialize() {
  if (!initialization) {
    initialization = pool.query(`
      CREATE TABLE IF NOT EXISTS tutor_documents (
        id BIGSERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        rag_doc_id TEXT UNIQUE,
        filename TEXT NOT NULL,
        size_bytes BIGINT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('processing', 'ready', 'failed')),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS tutor_documents_user_id_idx ON tutor_documents (user_id);
      CREATE TABLE IF NOT EXISTS tutor_conversations (
        id BIGSERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        course_id TEXT NOT NULL,
        rag_session_id TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS tutor_conversations_user_updated_idx
        ON tutor_conversations (user_id, updated_at DESC);
      CREATE TABLE IF NOT EXISTS tutor_messages (
        id BIGSERIAL PRIMARY KEY,
        conversation_id BIGINT NOT NULL REFERENCES tutor_conversations(id) ON DELETE CASCADE,
        role TEXT NOT NULL CHECK (role IN ('student', 'ai')),
        text TEXT NOT NULL,
        sources JSONB NOT NULL DEFAULT '[]'::jsonb,
        grounded BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS tutor_messages_conversation_idx
        ON tutor_messages (conversation_id, created_at);
      CREATE TABLE IF NOT EXISTS tutor_shared_documents (
        id BIGSERIAL PRIMARY KEY,
        uploaded_by TEXT NOT NULL,
        course_id TEXT NOT NULL,
        rag_doc_id TEXT NOT NULL UNIQUE,
        filename TEXT NOT NULL,
        size_bytes BIGINT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS tutor_shared_documents_course_idx
        ON tutor_shared_documents (course_id)
    `).catch((error) => {
      initialization = undefined;
      throw error;
    });
  }
  await initialization;
}

async function reservePrivateDocument(userId, filename, sizeBytes, limit) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock(hashtext($1), hashtext($2))', [
      'tutor-private-documents',
      userId,
    ]);
    const countResult = await client.query(
      `SELECT COUNT(*)::int AS used FROM tutor_documents
       WHERE user_id = $1 AND status IN ('processing', 'ready')`,
      [userId],
    );
    const used = countResult.rows[0].used;
    if (used >= limit) {
      await client.query('ROLLBACK');
      return { limit, used };
    }

    const inserted = await client.query(
      `INSERT INTO tutor_documents (user_id, filename, size_bytes, status)
       VALUES ($1, $2, $3, 'processing') RETURNING id, created_at`,
      [userId, filename, sizeBytes],
    );
    await client.query('COMMIT');
    return { row: inserted.rows[0], limit, used: used + 1 };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function completePrivateDocument(id, userId, ragDocId) {
  const result = await pool.query(
    `UPDATE tutor_documents SET rag_doc_id = $3, status = 'ready'
     WHERE id = $1 AND user_id = $2 AND status = 'processing' RETURNING id`,
    [id, userId, ragDocId],
  );
  if (!result.rowCount) throw new Error('The reserved document upload no longer exists.');
}

async function deletePrivateDocument(id, userId) {
  return pool.query('DELETE FROM tutor_documents WHERE id = $1 AND user_id = $2', [id, userId]);
}

async function listPrivateDocuments(userId) {
  const result = await pool.query(
    `SELECT id, rag_doc_id AS "docId", filename, size_bytes AS "sizeBytes",
            status, created_at AS "createdAt"
     FROM tutor_documents WHERE user_id = $1 AND status IN ('processing', 'ready')
     ORDER BY created_at DESC`,
    [userId],
  );
  return result.rows;
}

async function getPrivateDocument(id, userId) {
  const result = await pool.query(
    `SELECT id, rag_doc_id AS "docId", filename FROM tutor_documents
     WHERE id = $1 AND user_id = $2 AND status = 'ready'`,
    [id, userId],
  );
  return result.rows[0] || null;
}

async function getOwnedPrivateDocIds(userId) {
  const result = await pool.query(
    `SELECT rag_doc_id AS id FROM tutor_documents
     WHERE user_id = $1 AND status = 'ready' AND rag_doc_id IS NOT NULL`,
    [userId],
  );
  return result.rows.map((row) => row.id);
}

async function createConversation({ userId, courseId, ragSessionId, title }) {
  const result = await pool.query(
    `INSERT INTO tutor_conversations (user_id, course_id, rag_session_id, title)
     VALUES ($1, $2, $3, $4)
     RETURNING id, course_id AS "courseId", title, created_at AS "createdAt",
               updated_at AS "updatedAt"`,
    [userId, courseId, ragSessionId, title],
  );
  return result.rows[0];
}

async function getConversation(id, userId) {
  const result = await pool.query(
    `SELECT id, user_id AS "userId", course_id AS "courseId",
            rag_session_id AS "ragSessionId", title, created_at AS "createdAt",
            updated_at AS "updatedAt"
     FROM tutor_conversations WHERE id = $1 AND user_id = $2`,
    [id, userId],
  );
  return result.rows[0] || null;
}

async function listConversations(userId) {
  const result = await pool.query(
    `SELECT id, course_id AS "courseId", title, created_at AS "createdAt",
            updated_at AS "updatedAt"
     FROM tutor_conversations WHERE user_id = $1 ORDER BY updated_at DESC`,
    [userId],
  );
  return result.rows;
}

async function listMessages(conversationId) {
  const result = await pool.query(
    `SELECT id, role, text, sources, grounded, created_at AS "createdAt"
     FROM tutor_messages WHERE conversation_id = $1 ORDER BY created_at`,
    [conversationId],
  );
  return result.rows;
}

async function saveConversationTurn(conversationId, question, answer, sources, grounded) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `INSERT INTO tutor_messages (conversation_id, role, text) VALUES ($1, 'student', $2)`,
      [conversationId, question],
    );
    await client.query(
      `INSERT INTO tutor_messages (conversation_id, role, text, sources, grounded)
       VALUES ($1, 'ai', $2, $3::jsonb, $4)`,
      [conversationId, answer, JSON.stringify(sources), grounded],
    );
    await client.query(
      'UPDATE tutor_conversations SET updated_at = NOW() WHERE id = $1',
      [conversationId],
    );
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function deleteConversation(id, userId) {
  return pool.query('DELETE FROM tutor_conversations WHERE id = $1 AND user_id = $2', [
    id,
    userId,
  ]);
}

async function createSharedDocument({ uploadedBy, courseId, ragDocId, filename, sizeBytes }) {
  const result = await pool.query(
    `INSERT INTO tutor_shared_documents (uploaded_by, course_id, rag_doc_id, filename, size_bytes)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, rag_doc_id AS "docId", filename, course_id AS "courseId",
               created_at AS "createdAt"`,
    [uploadedBy, courseId, ragDocId, filename, sizeBytes],
  );
  return result.rows[0];
}

async function listSharedDocumentIds(courseId) {
  const result = await pool.query(
    `SELECT rag_doc_id FROM tutor_shared_documents
     WHERE course_id = $1 OR course_id = 'global'`,
    [courseId],
  );
  return new Set(result.rows.map((row) => row.rag_doc_id));
}

async function getSharedDocument(id) {
  const result = await pool.query(
    `SELECT id, uploaded_by AS "uploadedBy", rag_doc_id AS "docId", filename
     FROM tutor_shared_documents WHERE id::text = $1 OR rag_doc_id = $1`,
    [id],
  );
  return result.rows[0] || null;
}

async function deleteSharedDocument(id) {
  return pool.query('DELETE FROM tutor_shared_documents WHERE id = $1', [id]);
}

module.exports = {
  initialize,
  reservePrivateDocument,
  completePrivateDocument,
  deletePrivateDocument,
  listPrivateDocuments,
  getPrivateDocument,
  getOwnedPrivateDocIds,
  createConversation,
  getConversation,
  listConversations,
  listMessages,
  saveConversationTurn,
  deleteConversation,
  createSharedDocument,
  listSharedDocumentIds,
  getSharedDocument,
  deleteSharedDocument,
};
