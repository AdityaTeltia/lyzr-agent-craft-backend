const Agent = require('../models/agent');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
require('dotenv').config();

const LYZR_API_KEY = process.env.LYZR_API_KEY;
const LYZR_RAG_API_URL = 'https://rag-prod.studio.lyzr.ai/v3';
const LYZR_AGENT_API_URL = 'https://agent-prod.studio.lyzr.ai/v3';

// Function to create a knowledge base
const createKnowledgeBase = async (name) => {
  try {
    const response = await axios.post(
      `${LYZR_RAG_API_URL}/rag/`,
      {
        user_id: LYZR_API_KEY,
        description: name,
        semantic_data_model: false,
        name: name,
        vector_db_credential_id: 'lyzr_qdrant',
        vector_store_provider: 'Qdrant [Lyzr]',
        embedding_model: 'text-embedding-ada-002',
        collection_name: name,
        llm_credential_id: 'lyzr_openai',
        embedding_credential_id: 'lyzr_openai',
        llm_model: 'gpt-4o-mini',
      },
      {
        headers: {
          'x-api-key': LYZR_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error creating knowledge base:', error.response ? error.response.data : error.message);
    throw new Error('Failed to create knowledge base.');
  }
};

// Function to parse a PDF file
const parsePdf = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', fs.createReadStream(file.path), {
      filename: file.originalname,
      contentType: file.mimetype,
    });
    formData.append('data_parser', 'llmsherpa');

    const response = await axios.post(
      `${LYZR_RAG_API_URL}/parse/pdf/`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'x-api-key': LYZR_API_KEY,
        },
      }
    );
    return response.data.documents;
  } catch (error) {
    console.error('Error parsing PDF:', error.response ? error.response.data : error.message);
    throw new Error('Failed to parse PDF.');
  }
};

// Function to upload documents to a knowledge base
const uploadToKnowledgeBase = async (knowledgeBaseId, documents) => {
  try {
    await axios.post(
      `${LYZR_RAG_API_URL}/rag/train/${knowledgeBaseId}/`,
      documents,
      {
        headers: {
          'x-api-key': LYZR_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error uploading to knowledge base:', error.response ? error.response.data : error.message);
    throw new Error('Failed to upload to knowledge base.');
  }
};

// Function to create a Lyzr agent
const createLyzrAgent = async (name, systemPrompt, knowledgeBaseId, knowledgeBaseName) => {
  try {
    const response = await axios.post(
      `${LYZR_AGENT_API_URL}/agents/template/single-task`,
      {
        name: name,
        description: 'testing agent',
        agent_role: systemPrompt,
        agent_goal: 'Your goal is to address and solve customer inquiries',
        agent_instructions: '',
        examples: null,
        tool: '',
        tool_usage_description: '{}',
        provider_id: 'OpenAI',
        model: 'gpt-4o-mini',
        temperature: 0.7,
        top_p: 0.9,
        llm_credential_id: 'lyzr_openai',
        features: [
          {
            type: 'KNOWLEDGE_BASE',
            config: {
              lyzr_rag: {
                base_url: 'https://rag-prod.studio.lyzr.ai',
                rag_id: knowledgeBaseId,
                rag_name: knowledgeBaseName,
                params: {
                  top_k: 5,
                  retrieval_type: 'basic',
                  score_threshold: 0.5,
                },
              },
              agentic_rag: [],
            },
            priority: 0,
          },
        ],
        managed_agents: [],
        response_format: { type: 'text' },
      },
      {
        headers: {
          'x-api-key': LYZR_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data.agent_id;
  } catch (error) {
    console.error('Error creating Lyzr agent:', error.response ? error.response.data : error.message);
    throw new Error('Failed to create Lyzr agent.');
  }
};

exports.createAgent = async (req, res) => {
  const { name, systemPrompt, userId } = req.body;
  const file = req.file;

  try {
    // Step 1: Create Knowledge Base
    const knowledgeBase = await createKnowledgeBase(name);
    const { id: knowledgeBaseId, name: knowledgeBaseName } = knowledgeBase;

    // Step 2: Parse PDF
    const documents = await parsePdf(file);

    // Step 3: Upload to Knowledge Base
    await uploadToKnowledgeBase(knowledgeBaseId, documents);

    // Step 4: Create Agent
    const agentId = await createLyzrAgent(name, systemPrompt, knowledgeBaseId, knowledgeBaseName);
    const embeddingScript = `<script src="${process.env.BASE_API_URL}/api/embedding/${agentId}/embedding"></script>`;

    // Step 5: Save agent to database
    const agent = new Agent({
      _id: agentId,
      name,
      knowledgeBaseId,
      agentId,
      systemPrompt,
      embeddingScript,
      userId,
    });
    await agent.save();

    res.status(201).json(agent);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  } finally {
    // Clean up the uploaded file
    if (file) {
      fs.unlinkSync(file.path);
    }
  }
};

exports.getAllAgentsByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const agents = await Agent.find({ userId });
    res.status(200).json(agents);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getAgentById = async (req, res) => {
  try {
    const { agentId } = req.params;
    const agent = await Agent.findById(agentId);
    if (!agent) {
      return res.status(404).json({ message: 'Agent not found' });
    }
    res.status(200).json(agent);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};