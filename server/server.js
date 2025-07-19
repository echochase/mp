const express = require('express');
require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const logVisitHandler = require('./api/logVisitHandler');

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  process.env.CLIENT_ORIGIN,
  "https://github.com",
];

// CORS for API routes
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(express.json());

// ✅ Register the log visit API route
app.get('/api/log-visit', logVisitHandler); // or app.post(...) if needed

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  },
});

const socketHandler = require('./socket');
socketHandler(io);

server.listen(3000, () => {
  console.log('Server listening on port 3000');
});
