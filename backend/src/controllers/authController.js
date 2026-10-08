const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

const SALT_ROUNDS = 10;
const ALLOWED_SIGNUP_ROLES = ['student', 'teacher'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DUMMY_HASH = bcrypt.hashSync('dummy-password', SALT_ROUNDS);

function signToken(user) {
  // payload shape matches middleware/auth.js and roleCheck: req.user.id, req.user.role
  return jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: '1d',
  });
}

function toUserDTO(u) {
  return { id: u.id, name: u.name, email: u.email, role: u.role, department: u.department };
}

async function register(req, res) {
  const { name, email, password, role = 'student', department } = req.body || {};

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'name, email and password are required' });
  }
  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'invalid email format' });
  }
  if (password.length < 8 || password.length > 72) {
    return res.status(400).json({ error: 'password must be 8-72 characters' });
  }
  if (!ALLOWED_SIGNUP_ROLES.includes(role)) {
    return res.status(400).json({ error: 'role must be student or teacher' });
  }

  try {
    const normalizedEmail = email.trim().toLowerCase();
    if (await User.findByEmail(normalizedEmail)) {
      return res.status(409).json({ error: 'email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role,
      department: department || null,
    });

    return res.status(201).json({ token: signToken(user), user: toUserDTO(user) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'server error' });
  }
}

async function login(req, res) {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  try {
    const user = await User.findByEmail(email.trim().toLowerCase());

    // compare against a dummy hash when the user doesn't exist, so timing doesn't leak which emails exist
    const ok = await bcrypt.compare(password, user ? user.passwordHash : DUMMY_HASH);
    if (!user || !ok) {
      return res.status(401).json({ error: 'invalid email or password' });
    }

    return res.json({ token: signToken(user), user: toUserDTO(user) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'server error' });
  }
}

async function me(req, res) {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'user not found' });
    return res.json(toUserDTO(user));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'server error' });
  }
}

module.exports = { register, login, me };