// backend/routes/users.js
const express = require('express');
const router = express.Router();
const { getUsers } = require('../controllers/userController');
const authenticateToken = require('../middlewares/authMiddleware'); // <-- not destructured

router.get('/', authenticateToken, getUsers);

module.exports = router;
