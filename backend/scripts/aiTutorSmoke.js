const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const axios = require('axios');
const FormData = require('form-data');

const api = (process.env.API_URL || 'http://127.0.0.1:5000/api').replace(/\/+$/, '');
const pdfPath = process.env.AI_TUTOR_TEST_PDF;
const courseId = 'operating-systems';

for (const name of ['STUDENT_A_EMAIL', 'STUDENT_A_PASSWORD', 'STUDENT_B_EMAIL', 'STUDENT_B_PASSWORD', 'TEACHER_EMAIL', 'TEACHER_PASSWORD']) {
  if (!process.env[name]) throw new Error(`${name} must be set to run the AI Tutor integration checks.`);
}
if (!pdfPath || !fs.existsSync(pdfPath)) {
  throw new Error('AI_TUTOR_TEST_PDF must point to a readable PDF file.');
}

async function login(email, password) {
  const response = await axios.post(`${api}/auth/login`, { email, password });
  return response.data.token;
}

async function uploadPdf(token, filename = path.basename(pdfPath), buffer = fs.readFileSync(pdfPath), mimetype = 'application/pdf', additionalFields = {}) {
  const form = new FormData();
  form.append('file', buffer, { filename, contentType: mimetype });
  for (const [key, value] of Object.entries(additionalFields)) form.append(key, value);
  return axios.post(`${api}/ai/tutor/documents`, form, {
    headers: { ...form.getHeaders(), Authorization: `Bearer ${token}` },
    timeout: 240000,
    validateStatus: () => true,
  });
}

async function uploadShared(token) {
  const form = new FormData();
  form.append('file', fs.createReadStream(pdfPath), {
    filename: path.basename(pdfPath),
    contentType: 'application/pdf',
  });
  form.append('courseId', courseId);
  return axios.post(`${api}/ai/materials`, form, {
    headers: { ...form.getHeaders(), Authorization: `Bearer ${token}` },
    timeout: 240000,
    validateStatus: () => true,
  });
}

async function getDocuments(token) {
  return axios.get(`${api}/ai/tutor/documents`, {
    params: { courseId },
    headers: { Authorization: `Bearer ${token}` },
  });
}

async function main() {
  const [studentA, studentB, teacher] = await Promise.all([
    login(process.env.STUDENT_A_EMAIL, process.env.STUDENT_A_PASSWORD),
    login(process.env.STUDENT_B_EMAIL, process.env.STUDENT_B_PASSWORD),
    login(process.env.TEACHER_EMAIL, process.env.TEACHER_PASSWORD),
  ]);
  const initial = await getDocuments(studentA);
  assert.equal(initial.data.used, 0, 'Student A must have no private PDFs before this test.');

  const uploadedIds = [];
  const conversationIds = [];
  let sharedDocId;
  try {
    const simultaneous = await Promise.all([
      uploadPdf(studentA),
      uploadPdf(studentA),
      uploadPdf(studentA),
    ]);
    const successfulUploads = simultaneous.filter((result) => result.status === 201);
    uploadedIds.push(...successfulUploads.map((result) => result.data.id));
    assert.equal(successfulUploads.length, 2, 'Exactly two concurrent uploads should succeed.');
    assert.equal(simultaneous.filter((result) => result.status === 409 && result.data.code === 'PDF_LIMIT_REACHED').length, 1, 'The third concurrent upload should hit the cap.');

    const firstDoc = simultaneous.find((result) => result.status === 201).data;
    const chat = await axios.post(`${api}/ai/tutor/chat`, {
      question: 'Summarize this document',
      courseId,
      docIds: [firstDoc.docId],
    }, {
      headers: { Authorization: `Bearer ${studentA}` },
      timeout: 120000,
      validateStatus: () => true,
    });
    assert.equal(chat.status, 200, 'A student should be able to chat about their private PDF.');
    assert.ok(chat.data.conversationId);
    conversationIds.push(chat.data.conversationId);
    const history = await axios.get(`${api}/ai/tutor/conversations/${chat.data.conversationId}`, {
      headers: { Authorization: `Bearer ${studentA}` },
    });
    assert.equal(history.data.messages.length, 2, 'The backend should persist both sides of a chat turn.');

    const third = await uploadPdf(studentA);
    assert.equal(third.status, 409, 'A third private PDF should be rejected.');

    const outsiderList = await getDocuments(studentB);
    assert.equal(outsiderList.data.private.some((doc) => doc.docId === firstDoc.docId), false, 'Student B must not see Student A PDFs.');

    const outsiderDelete = await axios.delete(`${api}/ai/tutor/documents/${firstDoc.id}`, {
      headers: { Authorization: `Bearer ${studentB}` },
      validateStatus: () => true,
    });
    assert.equal(outsiderDelete.status, 404, 'Student B must not delete Student A PDFs.');

    const outsiderChat = await axios.post(`${api}/ai/tutor/chat`, {
      question: 'Summarize this document',
      courseId,
      docIds: [firstDoc.docId],
    }, {
      headers: { Authorization: `Bearer ${studentB}` },
      validateStatus: () => true,
    });
    assert.equal(outsiderChat.status, 403, 'Student B must not chat against Student A document IDs.');

    const invalid = await uploadPdf(studentA, 'not-a-pdf.txt', Buffer.from('not a PDF'), 'text/plain');
    assert.equal(invalid.status, 400, 'Non-PDF uploads should be rejected.');

    const removed = await axios.delete(`${api}/ai/tutor/documents/${firstDoc.id}`, {
      headers: { Authorization: `Bearer ${studentA}` },
    });
    assert.equal(removed.status, 200, 'Deleting a private PDF should free its slot.');
    uploadedIds.splice(uploadedIds.indexOf(firstDoc.id), 1);
    const replacement = await uploadPdf(studentA);
    assert.equal(replacement.status, 201, 'A new PDF should upload after a slot is freed.');
    uploadedIds.push(replacement.data.id);

    const forbiddenSharedUpload = await uploadShared(studentA);
    assert.equal(forbiddenSharedUpload.status, 403, 'Students must not upload shared course material.');

    const shared = await uploadShared(teacher);
    assert.equal(shared.status, 201, 'Teachers should be able to upload shared course material.');
    sharedDocId = shared.data.docId;
    const studentMaterials = await axios.get(`${api}/ai/materials`, {
      params: { courseId },
      headers: { Authorization: `Bearer ${studentB}` },
    });
    assert.equal(studentMaterials.data.some((doc) => doc.id === sharedDocId), true, 'Students in the course should see shared material.');

    const forbiddenSharedDelete = await axios.delete(`${api}/ai/materials/${sharedDocId}`, {
      headers: { Authorization: `Bearer ${studentA}` },
      validateStatus: () => true,
    });
    assert.equal(forbiddenSharedDelete.status, 403, 'Students must not delete shared material.');
    console.log('AI Tutor integration checks passed.');
  } finally {
    await Promise.all([
      ...uploadedIds.map((id) =>
      axios.delete(`${api}/ai/tutor/documents/${id}`, {
        headers: { Authorization: `Bearer ${studentA}` },
        validateStatus: () => true,
      }),
      ),
      ...conversationIds.map((id) =>
        axios.delete(`${api}/ai/tutor/conversations/${id}`, {
          headers: { Authorization: `Bearer ${studentA}` },
          validateStatus: () => true,
        }),
      ),
    ]);
    if (sharedDocId) {
      await axios.delete(`${api}/ai/materials/${sharedDocId}`, {
        headers: { Authorization: `Bearer ${teacher}` },
        validateStatus: () => true,
      });
    }
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
