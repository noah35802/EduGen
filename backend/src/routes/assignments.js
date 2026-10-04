const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const { list, create, submit } = require('../controllers/assignmentController');

router.get('/', authMiddleware, list);
router.post('/', authMiddleware, roleCheck('teacher'), create);
router.post('/:id/submit', authMiddleware, roleCheck('student'), submit);

module.exports = router;