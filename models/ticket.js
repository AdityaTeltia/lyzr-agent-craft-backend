
const mongoose = require('mongoose');

const TicketSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['open', 'closed', 'escalated'],
    default: 'open',
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
  },
  agent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agent',
  },
  chatHistory: [
    {
      sender: String,
      message: String,
      timestamp: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  userId: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model('Ticket', TicketSchema);
