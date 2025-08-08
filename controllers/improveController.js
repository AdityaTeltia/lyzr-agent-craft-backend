// controllers/chatLoggerController.js
const Ticket = require('../models/ticket');
const Agent = require('../models/agent');

exports.improveAgent = async (req, res) => {
  try {
    const { agentId } = req.body;

    const lastFiveTickets = await Ticket.find({ agent: agentId })
      .sort({ createdAt: -1, _id: -1 })
      .limit(5)
      .lean();

    const agent = await Agent.findById(agentId);
    if (!lastFiveTickets || lastFiveTickets.length === 0 || !agent) {
      return res.status(404).json({
        success: false,
        error: 'No tickets found for this agent',
      });
    }

    const CHAT_API_URL = 'https://agent-prod.studio.lyzr.ai/v3/inference/chat/';
    const sessionId = Math.random().toString(36).substring(2);
    const userEmail = 'SystemAgent';

    const chatHistories = lastFiveTickets.map(ticket => ticket.chatHistory || []);
    let text = JSON.stringify(chatHistories);
    const systemPrompt = agent.systemPrompt;
    text = "{system prompt: " + systemPrompt + "\n" + "chat histories: " + text + "}";

    const fetchResponse = await fetch(CHAT_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.LYZR_API_KEY,
      },
      body: JSON.stringify({
        user_id: userEmail,
        agent_id: process.env.IMPROVE_AGENT_ID,
        session_id: sessionId,
        message: text,
        system_prompt_variables: {},
        filter_variables: {},
      }),
    });

    const data = await fetchResponse.json();

    return res.status(200).json({
      success: true,
      response: data.response,
    });

  } catch (error) {
    console.log('[Improve Agent Error]', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to improve agent',
    });
  }
};


exports.sentimentGraph = async (req, res) => {
  try {
    const { agentId } = req.body;
    const tickets = await Ticket.find({ agent: agentId })
        .sort({ createdAt: -1, _id: -1 })

    if(!tickets || tickets.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No tickets found for this agent',
      });
    }

    const CHAT_API_URL = 'https://agent-prod.studio.lyzr.ai/v3/inference/chat/';
    const sessionId = Math.random().toString(36).substring(2);
    const userEmail = 'SystemAgent';

    const chatHistories = tickets.map(ticket => ticket.chatHistory || []);
    const text = JSON.stringify(tickets);

    const fetchResponse = await fetch(CHAT_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.LYZR_API_KEY,
        },
        body: JSON.stringify({
          user_id: userEmail,
          agent_id: process.env.SENTIMENT_AGENT_ID,
          session_id: sessionId,
          message: text,
          system_prompt_variables: {},
          filter_variables: {},
        }),
      });

    const data = await fetchResponse.json();

    return res.status(200).json({
    success: true,
    response: data.response,
    });
  
      
    
  } catch (error) {
    console.error('[Sentiment Graph Error]', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get sentiment graph',
    });
  }
};