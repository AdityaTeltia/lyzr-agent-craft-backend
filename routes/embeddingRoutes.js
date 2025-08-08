
const express = require('express');
const { generateEmbeddingScript } = require('../controllers/embeddingController');

const router = express.Router();

router.get('/:agentId/embedding', generateEmbeddingScript);

module.exports = router;
