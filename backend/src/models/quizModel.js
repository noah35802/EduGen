const pool = require('../db');

async function getAllQuizzes() {
  const result = await pool.query('SELECT * FROM quizzes ORDER BY created_at DESC');
  return result.rows;
}

async function addQuestion(quizId, questionText, options, correctOption) {
  const result = await pool.query(
    `INSERT INTO quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [quizId, questionText, options.a, options.b, options.c, options.d, correctOption]
  );
  return result.rows[0];
}

async function getQuizWithQuestions(quizId) {
  const quiz = await pool.query('SELECT * FROM quizzes WHERE id = $1', [quizId]);
  const questions = await pool.query(
    'SELECT id, question_text, option_a, option_b, option_c, option_d FROM quiz_questions WHERE quiz_id = $1',
    [quizId]
  );
  return { quiz: quiz.rows[0], questions: questions.rows };
}

async function getCorrectAnswers(quizId) {
  const result = await pool.query(
    'SELECT id, correct_option FROM quiz_questions WHERE quiz_id = $1',
    [quizId]
  );
  return result.rows;
}

async function recordAttempt(quizId, studentId, score, correctCount, incorrectCount, timeTakenSeconds) {
  const result = await pool.query(
    `INSERT INTO quiz_attempts (quiz_id, student_id, score, correct_count, incorrect_count, time_taken_seconds)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (quiz_id, student_id)
     DO UPDATE SET score = $3, correct_count = $4, incorrect_count = $5, time_taken_seconds = $6, attempted_at = NOW()
     RETURNING *`,
    [quizId, studentId, score, correctCount, incorrectCount, timeTakenSeconds]
  );
  return result.rows[0];
}

async function getAttempt(quizId, studentId) {
  const result = await pool.query(
    'SELECT * FROM quiz_attempts WHERE quiz_id = $1 AND student_id = $2',
    [quizId, studentId]
  );
  return result.rows[0];
}

module.exports = {
  getAllQuizzes,
  addQuestion,
  getQuizWithQuestions,
  getCorrectAnswers,
  recordAttempt,
  getAttempt,
};