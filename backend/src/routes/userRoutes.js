const express = require('express');
const { register, login, getProfile } = require('../controllers/userController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/profile', authenticateToken, getProfile);

module.exports = router;