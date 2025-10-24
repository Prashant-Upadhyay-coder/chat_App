// backend/routes/messages.js
const express = require('express');
const router = express.Router();
const { sendMessage, getMessages } = require('../controllers/messageController'); // correct function names
const { markSeen } = require('../controllers/messageController');
const authenticateToken = require('../middlewares/authMiddleware'); // import correctly

const { reactToMessage } = require('../controllers/messageController');



router.post('/', authenticateToken, sendMessage);
router.get('/:otherUserId', authenticateToken, getMessages);
router.post('/mark-seen', authenticateToken, markSeen);
router.post('/react', authenticateToken, reactToMessage);

module.exports = router;
