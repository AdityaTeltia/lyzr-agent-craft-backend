const express = require('express');
const router = express.Router();
const { improveAgent } = require('../controllers/improveController');


router.post(
  '/improve-agent',
  improveAgent
);


module.exports = router;