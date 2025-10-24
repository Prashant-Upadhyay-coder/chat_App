require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

const authController = require('./controllers/authController');
const userController = require('./controllers/userController');
const messageController = require('./controllers/messageController');
const authenticateToken = require('./middlewares/authMiddleware');
const initSocket = require('./utils/socket');

const app = express();
app.use(cors());
app.use(express.json());

// Auth routes
app.post('/api/auth/register', authController.register);
app.post('/api/auth/login', authController.login);

// User routes
app.get('/api/users', authenticateToken, userController.getUsers);

// Message routes
app.get('/api/messages/:otherUserId', authenticateToken, messageController.getMessages);
app.post('/api/messages', authenticateToken, messageController.sendMessage);
app.put('/api/messages/edit', authenticateToken, messageController.editMessage);
app.delete('/api/messages/:id', authenticateToken, messageController.deleteMessage);
app.post('/api/messages/mark-seen', authenticateToken, messageController.markSeen);

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// Socket authentication
io.use((socket, next) => {
  const token = socket.handshake.query.token;
  if (!token) return next(new Error('Authentication error'));
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return next(new Error('Authentication error'));
    socket.user = decoded;
    next();
  });
});

// Initialize Socket.IO events
initSocket(io);

server.listen(process.env.PORT || 4000, () => console.log('Server running on port 4000'));
