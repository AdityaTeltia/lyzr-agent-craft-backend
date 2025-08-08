
const Ticket = require('../models/ticket');

exports.createTicket = async (req, res) => {
  try {
    const { title, description, agentId, userId } = req.body;

    const ticket = new Ticket({
      title,
      description,
      agent: agentId,
      userId,
    });

    await ticket.save();

    res.status(201).json(ticket);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find({});
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getTicketById = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    res.json(ticket);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.replyToTicket = async (req, res) => {
  try {
    const { message, sender } = req.body;
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    ticket.chatHistory.push({ sender, message });
    await ticket.save();

    res.json(ticket);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getTicketsByStatus = async (req, res) => {
  try {
    const tickets = await Ticket.find({ status: req.params.status });
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getTicketsByPriority = async (req, res) => {
  try {
    const tickets = await Ticket.find({ priority: req.params.priority });
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getTicketsByAgent = async (req, res) => {
  try {
    const tickets = await Ticket.find({ agent: req.params.agentId });
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
