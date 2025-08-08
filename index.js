
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const bodyParser = require('body-parser');
const cors = require('cors');
const { ClerkExpressRequireAuth } = require('@clerk/clerk-sdk-node');
const connectDB = require('./config/db');
const agentRoutes = require('./routes/agentRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const embeddingRoutes = require('./routes/embeddingRoutes');
const chatRoutes = require('./routes/chatRoutes');
const improveRoutes = require('./routes/improveRoutes');

require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Connect to database
connectDB();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Routes
app.use('/api/agents', agentRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/embedding', embeddingRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/improve', improveRoutes);

// Socket.io for real-time chat
io.on('connection', (socket) => {
  console.log('New client connected');

  socket.on('joinRoom', (ticketId) => {
    socket.join(ticketId);
  });

  socket.on('sendMessage', (data) => {
    io.to(data.ticketId).emit('receiveMessage', data);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
