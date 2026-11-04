function positiveInteger(value, fallback, name) {
  if (value === undefined || value === '') return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`${name} must be a positive integer`);
  }
  return parsed;
}

const courses = Object.freeze({
  'computer-networks': Object.freeze({
    title: 'Computer Networks',
    ragCourseId: 'cn',
  }),
  dbms: Object.freeze({
    title: 'Database Management',
    ragCourseId: 'dbms',
  }),
  'operating-systems': Object.freeze({
    title: 'Operating Systems',
    ragCourseId: 'os',
  }),
  'object-oriented-programming': Object.freeze({
    title: 'Object-Oriented Programming',
    ragCourseId: 'oops',
  }),
  'data-structures': Object.freeze({
    title: 'Data Structures',
    ragCourseId: 'data-structures',
  }),
  'machine-learning': Object.freeze({
    title: 'Machine Learning',
    ragCourseId: 'machine-learning',
  }),
});

module.exports = Object.freeze({
  courses,
  maxPdfs: positiveInteger(process.env.TUTOR_MAX_PDFS, 2, 'TUTOR_MAX_PDFS'),
  maxPdfMb: positiveInteger(process.env.TUTOR_MAX_PDF_MB, 20, 'TUTOR_MAX_PDF_MB'),
  maxSharedUploadMb: positiveInteger(process.env.MAX_RAG_UPLOAD_MB, 20, 'MAX_RAG_UPLOAD_MB'),
});
