// Temporary in-memory store. Data resets when the server restarts.
// TODO: replace the three functions below with PostgreSQL queries using ../db.
// The auth controller only depends on these three function signatures.

const users = [];
let nextId = 1;

async function findByEmail(email) {
  return users.find((u) => u.email === email) || null;
}

async function findById(id) {
  return users.find((u) => u.id === id) || null;
}

async function create({ name, email, passwordHash, role, department }) {
  const user = { id: nextId++, name, email, passwordHash, role, department };
  users.push(user);
  return user;
}

module.exports = { findByEmail, findById, create };