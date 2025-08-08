// controllers/chatLoggerController.js
const Ticket = require('../models/ticket');

exports.logChatToTicket = async (req, res) => {
  try {
    const { sessionId, message, sender, agentId, userId, adminId } = req.body;
    const updatedTicket = await Ticket.findOneAndUpdate(
      { title: sessionId },
      {
        $setOnInsert: {
          title: sessionId,
          description: `Chat session for ${userId}`,
          status: 'open',
          priority: 'medium',
          agent: agentId,
          userId,
          adminId
        },
        $push: {
          chatHistory: {
            sender,
            message,
            timestamp: new Date(),
          },
        },
      },
      {
        new: true,
        upsert: true,
      }
    );

    res.status(200).json({ success: true, ticketId: updatedTicket._id });
  } catch (error) {
    console.error('[Chat Logging Error]', error);
    res.status(500).json({ success: false, error: 'Failed to log chat' });
  }
};