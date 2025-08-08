const express = require('express');
const router = express.Router();
const { createAgent, getAllAgentsByUserId, getAgentById } = require('../controllers/agentController');
const { ClerkExpressRequireAuth } = require('@clerk/clerk-sdk-node');
const multer = require('multer');

const upload = multer({ dest: 'uploads/' });

router.post(
  '/create-agent',
//   ClerkExpressRequireAuth(),
  upload.single('file'),
  createAgent
);

router.get('/user/:userId', getAllAgentsByUserId);
router.get('/:agentId', getAgentById);

module.exports = router;