const pool = require('../db');

function toAssignmentDTO(row, submission) {
  return {
    id: row.id,
    title: row.title,
    subject: row.subject,
    dueDate: row.due_date,
    status: submission ? submission.status : 'Pending',
    score: submission ? submission.score : undefined,
  };
}

async function list(req, res) {
  const assignments = await pool.query('SELECT * FROM assignments ORDER BY due_date ASC');

  const submissions = await pool.query(
    'SELECT * FROM submissions WHERE student_id = $1',
    [req.user.id]
  );
  const submissionByAssignment = {};
  submissions.rows.forEach((s) => {
    submissionByAssignment[s.assignment_id] = s;
  });

  const result = assignments.rows.map((a) => toAssignmentDTO(a, submissionByAssignment[a.id]));
  res.json(result);
}

async function create(req, res) {
  const { title, subject, courseId, dueDate } = req.body;
  if (!title || !subject) return res.status(400).json({ error: 'title and subject are required' });

  const result = await pool.query(
    'INSERT INTO assignments (title, subject, course_id, due_date) VALUES ($1, $2, $3, $4) RETURNING *',
    [title, subject, courseId || null, dueDate || null]
  );
  res.status(201).json(toAssignmentDTO(result.rows[0], null));
}

async function submit(req, res) {
  const result = await pool.query(
    `INSERT INTO submissions (assignment_id, student_id, status, submitted_at)
     VALUES ($1, $2, 'Submitted', NOW())
     ON CONFLICT (assignment_id, student_id)
     DO UPDATE SET status = 'Submitted', submitted_at = NOW()
     RETURNING *`,
    [req.params.id, req.user.id]
  );
  res.status(201).json(result.rows[0]);
}

module.exports = { list, create, submit };