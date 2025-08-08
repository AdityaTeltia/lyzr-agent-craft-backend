const express = require('express');
const router = express.Router();
const { logChatToTicket } = require('../controllers/chatLoggerController');

router.post('/log-chat', logChatToTicket);

module.exports = router;