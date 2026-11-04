const pool = require('../db');

async function initialize() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id BIGSERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('student', 'teacher')),
      department TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function findByEmail(email) {
  const result = await pool.query(
    'SELECT id, name, email, password_hash AS "passwordHash", role, department FROM users WHERE email = $1',
    [email],
  );
  return result.rows[0] || null;
}

async function findById(id) {
  const result = await pool.query(
    'SELECT id, name, email, password_hash AS "passwordHash", role, department FROM users WHERE id = $1',
    [id],
  );
  return result.rows[0] || null;
}

async function create({ name, email, passwordHash, role, department }) {
  const result = await pool.query(
    `INSERT INTO users (name, email, password_hash, role, department)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, name, email, password_hash AS "passwordHash", role, department`,
    [name, email, passwordHash, role, department],
  );
  return result.rows[0];
}

module.exports = { initialize, findByEmail, findById, create };