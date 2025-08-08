
const express = require('express');
const router = express.Router();
const {
  createTicket,
  getTickets,
  getTicketById,
  replyToTicket,
  getTicketsByStatus,
  getTicketsByPriority,
  getTicketsByAgent,
  getTicketsByAdminId
} = require('../controllers/ticketController');
const { ClerkExpressRequireAuth } = require('@clerk/clerk-sdk-node');

router.post('/create-ticket',  createTicket);
router.get('/get-all-tickets',  getTickets);
router.get('/get-ticket-by-id/:id',  getTicketById);
router.post('/reply-ticket/:id',  replyToTicket);
router.get('/get-ticket-by-admin/:adminId',  getTicketsByAdminId);
router.get('/get-ticket-by-status/:status',  getTicketsByStatus);
router.get('/get-ticket-by-priority/:priority',  getTicketsByPriority);
router.get('/get-ticket-by-agent/:agentId',  getTicketsByAgent);

module.exports = router;
