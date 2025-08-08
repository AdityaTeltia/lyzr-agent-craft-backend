const express = require('express');
const router = express.Router();
const { improveAgent, sentimentGraph } = require('../controllers/improveController');


router.post(
  '/improve-agent',
  improveAgent
);

router.post(
  '/sentiment-graph',
  sentimentGraph
)


module.exports = router;