const mongoose = require('mongoose');

const AgentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  knowledgeBaseId: {
    type: String,
    required: true,
  },
  agentId: {
    type: String,
    required: true,
  },
  systemPrompt: {
    type: String,
    required: true,
  },
  embeddingScript: {
    type: String,
    required: true,
  },
  userId: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model('Agent', AgentSchema);